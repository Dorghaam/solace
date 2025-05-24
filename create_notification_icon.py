from PIL import Image, ImageDraw, ImageFont
import os

# Create a 96x96 image with blue background
img = Image.new('RGBA', (96, 96), '#6096FD')
draw = ImageDraw.Draw(img)

# Add white 'S' letter in the center
try:
    # Try to use a system font
    font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 48)
except:
    # Fallback to default font
    font = ImageFont.load_default()

# Calculate text position to center it
text = 'S'
bbox = draw.textbbox((0, 0), text, font=font)
text_width = bbox[2] - bbox[0]
text_height = bbox[3] - bbox[1]
x = (96 - text_width) // 2
y = (96 - text_height) // 2 - 5  # Slight adjustment for visual centering

draw.text((x, y), text, fill='white', font=font)

# Save the image
img.save('./assets/images/notification-icon.png')
print('Notification icon created successfully!') 