import os
import shutil
|
folder = r'C:\Users\hp.DESKTOP-Q5PK6DI\OneDrive\Desktop\projects'

python_folder = os.path.join(folder, 'Python Files')
html_folder = os.path.join(folder, 'HTML Files')

# Create folders if they don't exist
os.makedirs(python_folder, exist_ok=True)
os.makedirs(html_folder, exist_ok=True)

for file in os.listdir(folder):
    file_path = os.path.join(folder, file)

    if os.path.isfile(file_path):
        if file.endswith('.py'):
            shutil.move(file_path, os.path.join(python_folder, file))
        elif file.endswith('.html'):
            shutil.move(file_path, os.path.join(html_folder, file))
print("Files have been organized.")