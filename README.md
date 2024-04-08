# Streamr Network Stats

A script that publishes basic Streamr Network stats to the selected stream.

## Customisables

Script is driven by the following env variables:

- `INDEXER_SUBGRAPH_URL` – URL of the Indexer subgraph (optional, defaults to mainnet indexer),
- `NETWORK_SUBGRAPH_URL` – URL of the Network Subgraph (optional, defaults to mainnet Network subgraph),
- `PUBLISHER_PRIV_KEY` – private key of the publisher (for the StreamrClient instance),
- `STREAM_ID` – target stream for the metrics.

## Stats – what's in the message?

The script publishes a message containing the following key-value pairs:

- `tvl` (number) – how much DATA is currently staked (whole DATA tokens, not wei),
- `apy` (number) – percent APY value (already multiplied by 100),
- `nodeCount` (number) – number of live operator nodes.

## How to run it?

It's best to use it with something like [`direnv`](https://direnv.net/) to keep it nice and tidy. Assuming you keep `PUBLISHER_PRIV_KEY` in `.envrc` here's how you'd publish a single metrics entry:

```
STREAM_ID=streamr.eth/metrics/network/min node script.js
```
