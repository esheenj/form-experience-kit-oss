"""Real-browser regression for the original fictional picnic form.

Uses a loopback server and an installed Chromium/Chrome; never downloads a
browser or submits user data. Playwright is a test-only MIT dependency.
"""
import functools
import http.server
import os
from pathlib import Path
import shutil
import threading
import unittest

from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


class BrowserFormTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        executable = os.environ.get("BROWSER_EXECUTABLE") or next(
            (path for name in ("google-chrome", "chromium", "chromium-browser")
             if (path := shutil.which(name))), None)
        if not executable:
            raise RuntimeError("Install Chrome/Chromium or set BROWSER_EXECUTABLE")
        cls.engine = sync_playwright().start()
        cls.browser = cls.engine.chromium.launch(
            executable_path=executable, headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"])
        print("Observed browser version:", cls.browser.version, flush=True)
        cls.server = http.server.ThreadingHTTPServer(
            ("127.0.0.1", 0), functools.partial(QuietHandler, directory=str(ROOT)))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.origin = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.engine.stop()
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=5)

    def setUp(self):
        self.context = self.browser.new_context(viewport={"width": 1440, "height": 900})
        self.addCleanup(self.context.close)
        self.external = []
        self.errors = []
        def allow_local(route):
            if route.request.url.startswith(self.origin + "/"):
                route.continue_()
            else:
                self.external.append(route.request.url)
                route.abort()
        self.context.route("**/*", allow_local)
        self.page = self.context.new_page()
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        self.page.goto(self.origin)
        expect(self.page.locator("#progress")).to_have_text("Step 1 of 3")

    def tearDown(self):
        self.assertEqual(self.errors, [], "Browser script error")
        self.assertEqual(self.external, [], "Unexpected external request")

    def to_review(self, activity="Imaginary park lunch"):
        self.page.locator("#activity").fill(activity)
        self.page.locator("#next").click()
        self.page.locator("#supply").fill("Reusable napkin")
        self.page.locator("#quantity").fill("2")
        self.page.locator("#next").click()
        expect(self.page.locator("#progress")).to_have_text("Step 3 of 3")

    def test_keyboard_navigation_and_error_summary_focus(self):
        self.page.keyboard.press("Tab")
        expect(self.page.locator("#activity")).to_be_focused()
        self.page.keyboard.press("Tab")
        expect(self.page.locator("#next")).to_be_focused()
        self.page.keyboard.press("Enter")
        expect(self.page.locator("#errors")).to_be_focused()
        expect(self.page.locator("#errors")).to_contain_text("3 and 80")
        expect(self.page.locator("[data-stage='1']")).to_be_hidden()
        self.page.locator("#activity").focus()
        self.page.keyboard.insert_text("Imaginary park lunch")
        self.page.keyboard.press("Tab")
        self.page.keyboard.press("Enter")
        expect(self.page.locator("#progress")).to_have_text("Step 2 of 3")
        expect(self.page.locator("#form-title")).to_be_focused()
        self.page.locator("#supply").fill("Reusable napkin")
        self.page.locator("#quantity").fill("21")
        self.page.locator("#next").click()
        expect(self.page.locator("#errors")).to_be_focused()
        expect(self.page.locator("#progress")).to_have_text("Step 2 of 3")
        expect(self.page.locator("#errors")).to_contain_text("1 to 20")
        self.page.locator("#quantity").fill("2")
        self.page.locator("#next").click()
        expect(self.page.locator("#review-data")).to_contain_text("Reusable napkin")
        self.page.locator("#back").click()
        expect(self.page.locator("#quantity")).to_have_value("2")

    def test_export_restore_and_invalid_draft_preserves_progress(self):
        self.to_review()
        self.page.locator("#save").click()
        expect(self.page.locator("#draft")).to_be_focused()
        saved = self.page.locator("#draft").input_value()
        self.page.reload()
        expect(self.page.locator("#progress")).to_have_text("Step 1 of 3")
        self.page.locator("#draft").fill(saved)
        self.page.locator("#restore").click()
        expect(self.page.locator("#progress")).to_have_text("Step 3 of 3")
        for invalid in ('{bad', '<script>window.injected=true</script>'):
            with self.subTest(draft=invalid):
                self.page.locator("#draft").fill(invalid)
                self.page.locator("#restore").click()
                expect(self.page.locator("#errors")).to_be_focused()
                expect(self.page.locator("#errors")).to_contain_text("invalid")
                expect(self.page.locator("#progress")).to_have_text("Step 3 of 3")
                self.page.locator("#save").click()
                self.assertEqual(self.page.locator("#draft").input_value(), saved)
                self.assertIsNone(self.page.evaluate("window.injected"))
        self.page.locator("#next").click()
        expect(self.page.locator("#done")).to_be_visible()
        expect(self.page.locator("#picnic-form")).to_be_hidden()
        self.page.locator("#save").click()
        complete = self.page.locator("#draft").input_value()
        self.page.reload()
        self.page.locator("#draft").fill(complete)
        self.page.locator("#restore").click()
        expect(self.page.locator("#done")).to_contain_text("complete")
        expect(self.page.locator("#picnic-form")).to_be_hidden()

    def test_local_file_roundtrip_and_invalid_import_preserve_current_state(self):
        self.to_review()
        self.page.locator("#save").click()
        saved = self.page.locator("#draft").input_value()
        with self.page.expect_download() as event:
            self.page.locator("#download").click()
        self.assertEqual(event.value.suggested_filename, "fictional-picnic-draft.json")
        self.page.reload()
        expect(self.page.locator("#progress")).to_have_text("Step 1 of 3")
        self.page.locator("#file-draft").set_input_files({
            "name": "fictional.json", "mimeType": "application/json",
            "buffer": saved.encode("utf-8")
        })
        expect(self.page.locator("#progress")).to_have_text("Step 3 of 3")
        self.assertEqual(self.page.locator("#draft").input_value(), saved)
        expect(self.page.locator("#file-draft")).to_have_value("")
        for bad in (b"{bad", b"X" * 2050, b'<script>window.injected=true</script>'):
            with self.subTest(bad_size=len(bad)):
                self.page.locator("#file-draft").set_input_files({
                    "name": "invalid.json", "mimeType": "application/json", "buffer": bad
                })
                expect(self.page.locator("#errors")).to_be_focused()
                expect(self.page.locator("#errors")).to_contain_text("unchanged")
                expect(self.page.locator("#progress")).to_have_text("Step 3 of 3")
                expect(self.page.locator("#file-draft")).to_have_value("")
                self.page.locator("#save").click()
                self.assertEqual(self.page.locator("#draft").input_value(), saved)
                self.assertIsNone(self.page.evaluate("window.injected"))

    def test_review_renders_user_text_without_executing_markup(self):
        text = '<img src=x onerror="window.injected=true">'
        self.to_review(text)
        expect(self.page.locator("#review-data")).to_contain_text(text)
        self.assertEqual(self.page.locator("#review-data img").count(), 0)
        self.assertIsNone(self.page.evaluate("window.injected"))

    def test_visible_controls_fit_small_portrait_and_landscape_viewports(self):
        for width, height in ((320, 640), (375, 812), (812, 375), (1440, 900)):
            with self.subTest(width=width, height=height):
                self.page.set_viewport_size({"width": width, "height": height})
                self.assertTrue(self.page.evaluate(
                    "document.documentElement.scrollWidth <= innerWidth"))
                for selector in ("#activity", "#next", "#draft", "#save", "#restore"):
                    box = self.page.locator(selector).bounding_box()
                    self.assertIsNotNone(box)
                    self.assertGreaterEqual(box["x"], 0)
                    self.assertLessEqual(box["x"] + box["width"], width)


if __name__ == "__main__":
    unittest.main(verbosity=2)
