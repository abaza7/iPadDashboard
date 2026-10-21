#!/usr/bin/env python3
"""Compatibility entrypoint: delegates to the browser e2e runner."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('browser_e2e.py')),run_name='__main__')
