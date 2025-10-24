# ocr-service/main.py

import httpx  # For asynchronous HTTP requests
import pytesseract
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl
from PIL import Image  # Pillow for image processing
import io  # For handling in-memory byte streams

# --- Configuration ---

# If you installed Tesseract to a custom path (not in system PATH),
# you must specify the path here.
# Example:
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Define the Pydantic model. FastAPI will use this for input validation.
# We expect a JSON body like: {"url": "http://..."}
class ImageUrl(BaseModel):
    url: HttpUrl  # HttpUrl validator checks if the provided string is a valid URL

# Initialize the FastAPI app
app = FastAPI()

# --- API Endpoint ---

@app.post("/ocr")
async def ocr_from_url(image_url: ImageUrl):
    """
    This endpoint receives an image URL, downloads the image,
    runs Tesseract OCR (with Czech language support),
    and returns the extracted text.
    """
    try:
        # 1. Asynchronously download the image using httpx
        async with httpx.AsyncClient() as client:
            response = await client.get(str(image_url.url))
            # Raise an error if the download fails (e.g., 404 Not Found)
            response.raise_for_status()

        # 2. Open the image from in-memory bytes using Pillow
        # 'response.content' holds the raw image data
        image_bytes = io.BytesIO(response.content)
        img = Image.open(image_bytes)

        # 3. Run Tesseract OCR
        # We specify lang='ces' to correctly read Czech characters (diacritics)
        text = pytesseract.image_to_string(img, lang='ces')

        # 4. Return the extracted text
        return {"text": text}

    except httpx.RequestError as e:
        # Handle download errors
        raise HTTPException(status_code=400, detail=f"Failed to download image: {str(e)}")
    except pytesseract.TesseractNotFoundError:
        # Handle missing Tesseract installation
        raise HTTPException(status_code=500, detail="Tesseract Error: The Tesseract executable was not found. Please install it and add it to your system's PATH.")
    except Exception as e:
        # Handle any other errors (e.g., corrupted image)
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

# --- Server Startup ---

# This allows running the server directly with "python main.py"
# but we'll use 'uvicorn' for development (as it supports --reload)
if __name__ == "__main__":
    import uvicorn
    # Run on port 8000, accessible from anywhere
    uvicorn.run(app, host="0.0.0.0", port=8000)