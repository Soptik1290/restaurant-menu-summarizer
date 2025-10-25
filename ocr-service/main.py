import httpx
import pytesseract
import pdfplumber 
import io
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl
from PIL import Image

class ImageUrl(BaseModel):
    """Pydantic model pro validaci URL v požadavcích"""
    url: HttpUrl 

# Inicializace FastAPI aplikace
app = FastAPI(title="OCR Service", description="Služba pro extrakci textu z obrázků a PDF souborů")

@app.post("/ocr")
async def ocr_from_url(image_url: ImageUrl):
    """
    Extrahuje text z obrázku pomocí OCR s podporou češtiny
    
    Args:
        image_url: Objekt obsahující URL obrázku
        
    Returns:
        dict: Slovník s extrahovaným textem
        
    Raises:
        HTTPException: Při chybě stahování nebo zpracování obrázku
    """
    try:
        # Stáhnutí obrázku z URL
        async with httpx.AsyncClient() as client:
            response = await client.get(str(image_url.url))
            response.raise_for_status()

        # Konverze na PIL Image objekt
        image_bytes = io.BytesIO(response.content)
        img = Image.open(image_bytes)
        
        # OCR extrakce s českým jazykem
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
    Extrahuje text z PDF souboru a vrací kombinovaný text ze všech stránek
    
    Args:
        pdf_url: Objekt obsahující URL PDF souboru
        
    Returns:
        dict: Slovník s extrahovaným textem ze všech stránek
        
    Raises:
        HTTPException: Při chybě stahování nebo zpracování PDF
    """
    try:
        # Stáhnutí PDF souboru z URL
        async with httpx.AsyncClient() as client:
            response = await client.get(str(pdf_url.url))
            response.raise_for_status()

        # Zpracování PDF pomocí pdfplumber
        pdf_bytes = io.BytesIO(response.content)
        all_text = ""
        
        with pdfplumber.open(pdf_bytes) as pdf:
            # Procházení všech stránek a extrakce textu
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
    # Spuštění serveru na všech síťových rozhraních portu 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)