# ocr-service/main.py

import httpx
import pytesseract
import pdfplumber  # <-- 1. Import PDF library
import io
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl
from PIL import Image

# --- Pydantic Model (remains the same) ---
class ImageUrl(BaseModel):
    url: HttpUrl

# --- FastAPI App (remains the same) ---
app = FastAPI()

# --- OCR Endpoint (remains the same) ---
@app.post("/ocr")
async def ocr_from_url(image_url: ImageUrl):
    """
    This endpoint receives an image URL, downloads the image,
    runs Tesseract OCR (with Czech language support),
    and returns the extracted text.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(str(image_url.url))
            response.raise_for_status()

        image_bytes = io.BytesIO(response.content)
        img = Image.open(image_bytes)
        text = pytesseract.image_to_string(img, lang='ces')
        
        return {"text": text}

    except httpx.RequestError as e:
        raise HTTPException(status_code=400, detail=f"Failed to download image: {str(e)}")
    except pytesseract.TesseractNotFoundError:
        raise HTTPException(status_code=500, detail="Tesseract Error: The Tesseract executable was not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

# --- !!! NEW PDF Endpoint !!! ---
@app.post("/pdf")
async def pdf_from_url(pdf_url: ImageUrl): # Re-using the same Pydantic model
    """
    This endpoint receives a PDF URL, downloads the file,
    extracts all text from it, and returns the combined text.
    """
    try:
        # 1. Asynchronously download the PDF file
        async with httpx.AsyncClient() as client:
            response = await client.get(str(pdf_url.url))
            response.raise_for_status()

        # 2. Open the PDF from in-memory bytes
        pdf_bytes = io.BytesIO(response.content)
        
        all_text = ""
        
        # 3. Use pdfplumber to open and read the PDF
        with pdfplumber.open(pdf_bytes) as pdf:
            # Loop through all pages in the PDF
            for page in pdf.pages:
                # Extract text from the current page
                text = page.extract_text()
                if text:
                    all_text += text + "\n" # Add text and a newline

        # 4. Return the combined text from all pages
        return {"text": all_text}

    except httpx.RequestError as e:
        raise HTTPException(status_code=400, detail=f"Failed to download PDF: {str(e)}")
    except Exception as e:
        # Handle errors like corrupted PDFs
        raise HTTPException(status_code=500, detail=f"An error occurred processing the PDF: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)