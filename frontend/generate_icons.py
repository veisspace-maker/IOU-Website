from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    # Create a black background
    img = Image.new('RGB', (size, size), color='black')
    draw = ImageDraw.Draw(img)
    
    # Calculate font size (30% of image size)
    font_size = int(size * 0.3)
    
    # Try to use a bold font, fall back to default if not available
    try:
        font = ImageFont.truetype("arialbd.ttf", font_size)
    except:
        try:
            font = ImageFont.truetype("Arial Bold.ttf", font_size)
        except:
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
            except:
                font = ImageFont.load_default()
    
    # Draw "UOMe" text in white, centered
    text = "UOMe"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2
    
    draw.text((x, y), text, fill='white', font=font)
    
    # Save the image
    filepath = os.path.join('public', filename)
    img.save(filepath, 'PNG')
    print(f"Created {filepath}")

# Create the icons
print("Generating PWA icons with 'UOMe' text...")
create_icon(192, 'pwa-192x192.png')
create_icon(512, 'pwa-512x512.png')
create_icon(180, 'apple-touch-icon.png')
print("\nAll icons generated successfully!")
print("\nNext steps:")
print("1. Rebuild your frontend")
print("2. Redeploy the app")
print("3. On your phone: uninstall the old PWA, clear browser cache, and reinstall")
