from dataclasses import dataclass
from typing import Protocol

import httpx


class QuoteNotFoundError(Exception):
    pass


class QuoteFetchError(Exception):
    pass


@dataclass(frozen=True)
class Quote:
    ticker: str
    tickerName: str
    price: float


class QuoteClient(Protocol):
    def get_quote(self, ticker: str) -> Quote: ...


class YahooFinanceQuoteClient:
    BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart"
    TIMEOUT = 5.0

    def get_quote(self, ticker: str) -> Quote:
        symbol = f"{ticker}.T"
        try:
            response = httpx.get(
                f"{self.BASE_URL}/{symbol}",
                params={"interval": "1d", "range": "1d"},
                headers={"User-Agent": "Mozilla/5.0"},
                timeout=self.TIMEOUT,
            )
        except httpx.HTTPError as exc:
            raise QuoteFetchError(f"failed to fetch quote for {ticker}") from exc

        if response.status_code != 200:
            raise QuoteFetchError(
                f"unexpected status code {response.status_code} for {ticker}"
            )

        try:
            result = response.json()["chart"]["result"]
        except (ValueError, KeyError, TypeError) as exc:
            raise QuoteFetchError(f"unexpected response shape for {ticker}") from exc

        if not result:
            raise QuoteNotFoundError(ticker)

        meta = result[0].get("meta", {})
        price = meta.get("regularMarketPrice")
        ticker_name = meta.get("longName") or meta.get("shortName")

        if price is None or not ticker_name:
            raise QuoteNotFoundError(ticker)

        return Quote(ticker=ticker, tickerName=ticker_name, price=float(price))
