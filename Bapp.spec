# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['Bapp.py'],
    pathex=[],
    binaries=[],
    datas=[('assets/iconos/LOGO.png', 'assets/iconos'), ('assets/iconos/icono.ico', 'assets/iconos')],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='Bapp',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=['assets\\iconos\\icono.ico'],
)
