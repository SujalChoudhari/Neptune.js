import os
import shutil
import json

if __name__ == '__main__':
    if not os.path.exists('/build'):
        os.mkdir('/build')
    with open("package.json",'r') as f:
        VERSION = json.load(f)

    SRC= os.path.join(os.path.abspath(os.getcwd()),"src")
    DEST= os.path.join(os.path.abspath(os.getcwd()),f"build\{VERSION['version']}\\neptune")

    shutil.rmtree(DEST)
    shutil.copytree(SRC,DEST)
    shutil.copy('LICENSE',DEST)
    shutil.make_archive(f"build/neptune-{VERSION['version']}", 'zip', DEST)
