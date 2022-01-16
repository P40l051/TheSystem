# The System
- Try some query on this smart specific smart contract <a href="https://thegraph.com/hosted-service/subgraph/p40l051/the-system" target="_blank">HERE</a>!
- Find more information about the <a href="https://thegraph.com/en/" target="_blank">The Graph</a>

## Example queries

* All token burned:
```bash
{
  transfers(where: {to: null}) {
    id
    valueExact
    token {
      id
      uri
    }
  }
}
```

* All Tokens Exchanged
```bash
{
  transfers(where: {from_not: null, to_not: null}) {
    id
    valueExact
    token {
      id
      uri
    }
  }
}
```

* All Tokens Minted
```bash
{
  transfers(where: {from: null}) {
    id
    to {
      id
    }
    valueExact
    token {
      id
      uri
    }
  }
}
```

* Token 0x4 analysis
```bash
{
  balances(orderBy: valueExact, orderDirection: asc, where: {token: "0x4", valueExact_not: 0}) {
    account {
      id
    }
    token {
      totalSupply {
        valueExact
      }
    }
    valueExact
  }
}
```

## License

MIT

---