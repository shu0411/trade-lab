from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_quote_client
from app.services.quote_client import QuoteClient, QuoteFetchError, QuoteNotFoundError

router = APIRouter()


@router.get("/{ticker}")
def get_quote(ticker: str, client: QuoteClient = Depends(get_quote_client)):
    try:
        quote = client.get_quote(ticker)
    except QuoteNotFoundError:
        raise HTTPException(status_code=404, detail="Quote not found")
    except QuoteFetchError:
        raise HTTPException(status_code=502, detail="Failed to fetch quote")

    return {
        "ticker": quote.ticker,
        "tickerName": quote.tickerName,
        "price": quote.price,
    }
