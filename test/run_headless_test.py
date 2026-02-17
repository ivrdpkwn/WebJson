from playwright.sync_api import sync_playwright
import os


def run_tests():
    with sync_playwright() as p:
        # Prefer Playwright-managed browsers; if not installed, fall back to system Chrome
        chrome_exe = os.environ.get('CHROME_PATH', '/usr/bin/google-chrome')
        launch_kwargs = {}
        if os.path.exists(chrome_exe):
            launch_kwargs = {"executable_path": chrome_exe, "headless": True, "args": ["--no-sandbox", "--disable-dev-shm-usage"]}
            print(f"Using system Chrome at {chrome_exe}")
            browser = p.chromium.launch(**launch_kwargs)
        else:
            browser = p.chromium.launch()
        page = browser.new_page()
        page.goto('http://localhost:8080', timeout=10000)

        # Test 1: valid JSON -> pretty output
        page.fill('#input', '{"a":1,"b":[1,2]}')
        page.click('#formatBtn')
        page.wait_for_timeout(500)
        out = page.locator('#output').inner_text()
        assert '"a": 1' in out
        print('TEST 1 OK: valid JSON formatted')

        # Test 2: invalid JSON -> error shown
        page.fill('#input', '{"a":')
        page.click('#formatBtn')
        page.wait_for_selector('#error', timeout=5000)
        err = page.locator('#error').inner_text()
        assert err.strip() != ''
        print('TEST 2 OK: invalid JSON error shown')

        # Test 3: view switch -> minified
        page.fill('#input', '{"x":[1,2]}')
        page.select_option('#viewSelect', 'minified')
        page.wait_for_timeout(200)
        assert page.locator('#output').inner_text().strip() == '{"x":[1,2]}'
        print('TEST 3 OK: minified view')

        # Test 4: theme persistence
        page.select_option('#themeSelect', 'dark')
        page.wait_for_timeout(200)
        page.reload()
        page.wait_for_timeout(200)
        has_dark = page.evaluate("() => document.documentElement.classList.contains('theme-dark')")
        assert has_dark
        print('TEST 4 OK: theme persisted after reload')

        # Test 5: large JSON -> use worker or server; ensure formatted and responsive
        # generate large JSON in the page to avoid transferring huge data via python
        page.evaluate("() => { const n = 300000; const obj = {x: 'y'.repeat(n)}; document.querySelector('#input').value = JSON.stringify(obj); }")
        page.click('#formatBtn')
        # wait until output has some newlines (pretty formatting) or an error appears
        page.wait_for_function("() => (document.querySelector('#output').innerText.length > 50) || (document.querySelector('#error') && document.querySelector('#error').innerText.length > 0)", timeout=30000)
        out_large = page.locator('#output').inner_text()
        err_large = page.locator('#error').inner_text()
        if not (out_large and out_large.strip().startswith('{') and '\n' in out_large):
            print('DEBUG: output_len=', len(out_large), 'error_len=', len(err_large))
            print('DEBUG output snippet:', out_large[:200])
            print('DEBUG error snippet:', err_large[:200])
            raise AssertionError('Large JSON formatting did not produce expected pretty output')
        print('TEST 5 OK: large JSON formatted (worker/server)')

        browser.close()
        print('ALL_TESTS_PASSED')

if __name__ == '__main__':
    run_tests()
