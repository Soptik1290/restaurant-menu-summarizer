import httpx
import pytesseract
import pdfplumber 
import io
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl
from PIL import Image

class ImageUrl(BaseModel):
    """Pydantic model for URL validation in requests"""
    url: HttpUrl 

app = FastAPI(title="OCR Service", description="Service for text extraction from images and PDF files")

@app.post("/ocr")
async def ocr_from_url(image_url: ImageUrl):
    """
    Extracts text from image using OCR with Czech language support
    
    Args:
        image_url: Object containing image URL
        
    Returns:
        dict: Dictionary with extracted text
        
    Raises:
        HTTPException: On download or processing error
    """
    try:
        # Download image from URL
        async with httpx.AsyncClient() as client:
            response = await client.get(str(image_url.url))
            response.raise_for_status()

        # Convert to PIL Image object
        image_bytes = io.BytesIO(response.content)
        img = Image.open(image_bytes)
        
        # OCR extraction with Czech language
        text = pytesseract.image_to_string(img, lang='ces')
        
        return {"text": text}

    except httpx.RequestError as e:
        raise HTTPException(status_code=400, detail=f"Failed to download image: {str(e)}")
    except pytesseract.TesseractNotFoundError:
        raise HTTPException(status_code=500, detail="Tesseract Error: The Tesseract executable was not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/pdf")
async def pdf_from_url(pdf_url: ImageUrl):
    """
    Extracts text from PDF file and returns combined text from all pages
    
    Args:
        pdf_url: Object containing PDF file URL
        
    Returns:
        dict: Dictionary with extracted text from all pages
        
    Raises:
        HTTPException: On download or processing error
    """
    try:
        # Download PDF file from URL
        async with httpx.AsyncClient() as client:
            response = await client.get(str(pdf_url.url))
            response.raise_for_status()

        # Process PDF using pdfplumber
        pdf_bytes = io.BytesIO(response.content)
        all_text = ""
        
        with pdfplumber.open(pdf_bytes) as pdf:
            # Iterate through all pages and extract text
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    all_text += text + "\n"

        return {"text": all_text}

    except httpx.RequestError as e:
        raise HTTPException(status_code=400, detail=f"Failed to download PDF: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred processing the PDF: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Start server on all network interfaces port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)