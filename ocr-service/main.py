import httpx
import pytesseract
import pdfplumber 
import io
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl
from PIL import Image

class ImageUrl(BaseModel):
    url: HttpUrl 

app = FastAPI()

@app.post("/ocr")
async def ocr_from_url(image_url: ImageUrl):
    """
    Extracts text from image using OCR with Czech language support
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

@app.post("/pdf")
async def pdf_from_url(pdf_url: ImageUrl):
    """
    Extracts text from PDF file and returns combined text from all pages
    """
    try:
        # Download PDF file
        async with httpx.AsyncClient() as client:
            response = await client.get(str(pdf_url.url))
            response.raise_for_status()

        # Process PDF with pdfplumber
        pdf_bytes = io.BytesIO(response.content)
        all_text = ""
        
        with pdfplumber.open(pdf_bytes) as pdf:
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
    uvicorn.run(app, host="0.0.0.0", port=8000)