#!/usr/bin/env python3
"""Headless browser regression using a local HTTP server; requires Python Playwright + Chromium.
Usage: python3 tools/browser_e2e.py
"""
from pathlib import Path
from functools import partial
from contextlib import contextmanager
from threading import Thread
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import os, sys

ROOT=Path(__file__).resolve().parent.parent
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

@contextmanager
def server():
    http=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(ROOT)))
    t=Thread(target=http.serve_forever,daemon=True);t.start()
    try: yield 'http://127.0.0.1:%d'%http.server_port
    finally: http.shutdown();http.server_close();t.join(timeout=3)

def run():
    from playwright.sync_api import sync_playwright
    errors=[]
    with server() as base, sync_playwright() as p:
        browser=p.chromium.launch(headless=True, executable_path=os.environ.get('CHROMIUM_PATH') or ('/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None), args=['--no-sandbox','--disable-dev-shm-usage'])
        context=browser.new_context(viewport={'width':1024,'height':768}, service_workers='block', permissions=[])
        # No external network calls are necessary for UI boot tests.
        context.route('**/*',lambda route:route.abort() if route.request.url.startswith(('https://','http://')) and not route.request.url.startswith(base) else route.continue_())
        page=context.new_page()
        page.on('pageerror',lambda err:errors.append(str(err)))
        try:
            response=page.goto(base+'/index.html',wait_until='domcontentloaded',timeout=12000)
            assert response.status==200
            target_base=base
        except Exception as exc:
            if 'ERR_BLOCKED_BY_ADMINISTRATOR' not in str(exc): raise
            target_base=ROOT.as_uri()
            page.goto(target_base+'/index.html',wait_until='domcontentloaded',timeout=12000)
            print('INFO: localhost denied by browser policy; using file URL fallback')
        page.locator('#qbtn').wait_for(timeout=10000)
        page.wait_for_function("document.querySelector('#qbtn').innerHTML.length > 0",timeout=12000)
        assert not page.locator('#qmini').is_visible()
        page.locator('#qbtn').click()
        assert page.locator('#qpanel').is_visible(),'Quran panel should open'
        page.locator('#qpanel').click(position={'x':3,'y':3})
        page.locator('#rbtn').click()
        assert page.locator('#rpanel').is_visible(),'Radio panel should open'
        # Test the actual mini-player Stop handler without initiating external audio.
        page.evaluate("() => { document.querySelector('#rpanel').hidden = true; document.querySelector('#qmini').hidden = false; document.querySelector('#qmStop').click(); }")
        assert not page.locator('#qmini').is_visible(),'Stop must close Quran mini-player'
        assert not errors, 'Dashboard uncaught JS errors: '+repr(errors)
        print('PASS: dashboard boot, Quran/radio panels and Quran Stop')
        remote=context.new_page();remote_errors=[]
        remote.on('pageerror',lambda err:remote_errors.append(str(err)))
        response=remote.goto(target_base+'/remote.html',wait_until='domcontentloaded',timeout=15000)
        assert response.status in (0,200) if response else True
        remote.locator('#setup').wait_for(timeout=10000)
        assert remote.locator('#save').count()==1
        assert not remote_errors,'Remote uncaught JS errors: '+repr(remote_errors)
        print('PASS: phone remote boot and pairing UI')
        context.close();browser.close()
if __name__=='__main__':
    try: run()
    except ImportError:
        print('ERROR: Playwright is required. Install with pip install playwright and playwright install chromium',file=sys.stderr);sys.exit(2)
