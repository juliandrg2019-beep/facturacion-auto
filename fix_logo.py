import base64
import re

# Read the image and encode it to base64
with open('logo maria gomez.jpg', 'rb') as f:
    encoded_string = base64.b64encode(f.read()).decode('utf-8')

# Read app.js
with open('app.js', 'r') as f:
    app_js = f.read()

# Remove any existing definition of logoBase64 that is currently there
# We'll use a regex to find them. The current file has:
# const logoBase64 = "data:image/jpeg;base64,...";
app_js = re.sub(r'const logoBase64 = "data:image/jpeg;base64,[^"]+";\n *', '', app_js)

# Insert the correct definition right before `return \``
new_code = f'const logoBase64 = "data:image/jpeg;base64,{encoded_string}";\n\n  return `'
app_js = app_js.replace('return `', new_code, 1)

# Write it back
with open('app.js', 'w') as f:
    f.write(app_js)

print("Fixed app.js")
