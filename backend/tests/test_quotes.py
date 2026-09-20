import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.dependencies import get_quote_client
from app.services.quote_client import Quote, QuoteNotFoundError, QuoteFetchError


class FakeQuoteClient:
    def __init__(self, quote=None, error=None):
        self._quote = quote
        self._error = error

    def get_quote(self, ticker: str) -> Quote:
        if self._error:
            raise self._error
        return self._quote


@pytest.fixture
def make_client():
    created = []

    def _make(quote=None, error=None):
        app.dependency_overrides[get_quote_client] = lambda: FakeQuoteClient(
            quote, error
        )
        client = TestClient(app)
        created.append(client)
        return client

    yield _make
    app.dependency_overrides.clear()


def test_get_quote_success(make_client):
    client = make_client(
        quote=Quote(ticker="4062", tickerName="イビデン", price=9572.0)
    )

    res = client.get("/quotes/4062")

    assert res.status_code == 200
    assert res.json() == {"ticker": "4062", "tickerName": "イビデン", "price": 9572.0}


def test_get_quote_not_found(make_client):
    client = make_client(error=QuoteNotFoundError("9999"))

    res = client.get("/quotes/9999")

    assert res.status_code == 404


def test_get_quote_upstream_error(make_client):
    client = make_client(error=QuoteFetchError("timeout"))

    res = client.get("/quotes/4062")

    assert res.status_code == 502
