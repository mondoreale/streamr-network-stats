const { StreamrClient } = require('@streamr/sdk')
const BigNumber = require('bignumber.js')

const IndexerSubgraphUrl =
    process.env.INDEXER_SUBGRAPH_URL ||
    'https://stream-metrics.streamr.network/api'

const NetworkSubgraphUrl =
    process.env.NETWORK_SUBGRAPH_URL ||
    'https://gateway-arbitrum.network.thegraph.com/api/8bcbd55cdd1369cadb0bb813d9817776/subgraphs/id/EGWFdhhiWypDuz22Uy7b3F69E9MEkyfU9iAQMttkH5Rj'

const PublisherPrivKey = process.env.PUBLISHER_PRIV_KEY

if (!PublisherPrivKey) {
    throw new Error('Define PUBLISHER_PRIV_KEY!')
}

const StreamId = process.env.STREAM_ID

if (!StreamId) {
    throw new Error('Define STREAM_ID!')
}

async function getTvlAndApy() {
    const batchSize = 999

    let totalStakeBN = new BigNumber(0)

    let totalYearlyPayoutBN = new BigNumber(0)

    let page = 0

    for (;;) {
        const resp = await fetch(NetworkSubgraphUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    query GetSponsorships($first: Int!, $skip: Int!) {
                        sponsorships(first: $first, skip: $skip) {
                            spotAPY
                            totalStakedWei
                        }
                    }
                `,
                variables: {
                    first: batchSize + 1,
                    skip: page * batchSize,
                },
            }),
        })

        const {
            data: { sponsorships },
        } = await resp.json()

        for (const { totalStakedWei, spotAPY } of sponsorships) {
            const totalStakedWeiBN = new BigNumber(totalStakedWei)

            totalStakeBN = totalStakeBN.plus(totalStakedWeiBN)

            totalYearlyPayoutBN = totalYearlyPayoutBN.plus(
                totalStakedWeiBN.multipliedBy(new BigNumber(spotAPY)),
            )
        }

        if (sponsorships.length <= batchSize) {
            /**
             * Recent batch was the last batch.
             */
            break
        }

        page = page + 1
    }

    return {
        apy: totalYearlyPayoutBN
            .dividedBy(totalStakeBN)
            .multipliedBy(100)
            .toNumber(),
        tvl: totalStakeBN.dividedBy(10 ** 18).toNumber(),
    }
}

async function getNodeCount() {
    const resp = await fetch(IndexerSubgraphUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query: `
                query GetSummary {
                    summary {
                        nodeCount
                    }
                }
            `,
            variables: {},
        }),
    })

    const {
        data: { summary },
    } = await resp.json()

    return summary.nodeCount
}

void (async () => {
    const client = new StreamrClient({
        auth: {
            privateKey: PublisherPrivKey,
        },
    })

    const { tvl, apy } = await getTvlAndApy()

    const nodeCount = await getNodeCount()

    const message = { tvl, apy, nodeCount }

    await client.subscribe(StreamId, () => {
        process.exit()
    })

    await client.publish(StreamId, message)
})()
