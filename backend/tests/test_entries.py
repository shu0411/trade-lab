ENTRY_PAYLOAD = {
    "type": "entry",
    "date": "2026-06-24",
    "ticker": "7203",
    "tickerName": "トヨタ自動車",
    "pattern": "押し目",
    "entryPrice": 3000.0,
    "targetPct": 10.0,
    "stopPct": 5.0,
    "holdDays": 20,
    "reasons": ["25日線反発"],
    "reasonNote": "",
}


def test_create_entry(client):
    res = client.post("/entries", json=ENTRY_PAYLOAD)
    assert res.status_code == 201
    data = res.json()
    assert data["ticker"] == "7203"
    assert data["status"] == "open"
    assert data["targetPrice"] == 3300.0
    assert data["stopPrice"] == 2850.0


def test_get_entry(client):
    entry_id = client.post("/entries", json=ENTRY_PAYLOAD).json()["id"]
    res = client.get(f"/entries/{entry_id}")
    assert res.status_code == 200
    assert res.json()["id"] == entry_id


def test_get_not_found(client):
    res = client.get("/entries/no-such-id")
    assert res.status_code == 404


def test_list_filter_by_type(client):
    client.post("/entries", json=ENTRY_PAYLOAD)
    client.post("/entries", json={**ENTRY_PAYLOAD, "type": "pass", "entryPrice": None, "targetPct": None, "stopPct": None})

    assert all(i["type"] == "entry" for i in client.get("/entries?type=entry").json())
    assert all(i["type"] == "pass" for i in client.get("/entries?type=pass").json())


def test_update_entry(client):
    entry_id = client.post("/entries", json=ENTRY_PAYLOAD).json()["id"]

    res = client.put(f"/entries/{entry_id}", json={
        "exitPrice": 3200.0,
        "result": "success",
        "resultNote": "目標達成",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "closed"
    assert data["result"] == "success"
    assert data["exitPrice"] == 3200.0


def test_update_not_found(client):
    res = client.put("/entries/no-such-id", json={"exitPrice": 100.0, "result": "success"})
    assert res.status_code == 404


def test_delete_entry(client):
    entry_id = client.post("/entries", json=ENTRY_PAYLOAD).json()["id"]
    assert client.delete(f"/entries/{entry_id}").status_code == 204
    assert client.get(f"/entries/{entry_id}").status_code == 404


def test_delete_not_found(client):
    assert client.delete("/entries/no-such-id").status_code == 404
