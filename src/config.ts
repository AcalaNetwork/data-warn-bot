export const config = {
  port: 1111,
  endPoints: {
    karura: "wss://karura-rpc-1.aca-api.network/",
    kusama: "wss://kusama-rpc.polkadot.io/",
    acala: "wss://acala.polkawallet.io/",
    polkadot: "wss://polkadot.api.onfinality.io/public-ws",
  },
  price: "https://api.polkawallet.io/price-server",
  ksm: {
    account: "F7fq1jMZkfuCuoMTyiEVAP2DMpMt18WopgBqTJznLihLNbZ",
    decimal: 12,
  },
  kar: {
    prefix: 8,
  },
  allNodes: {
    acala: [
      // third part
      "wss://acala-rpc.dwellir.com",
      // laminar
      "wss://acala-rpc-0.aca-api.network",
      "wss://acala-rpc-1.aca-api.network",
      "wss://acala-rpc-2.aca-api.network/ws",
      "wss://acala-rpc-3.aca-api.network/ws",
      // pw
      "wss://acala.polkawallet.io",
    ],
    karura: [
      // third part
      "wss://karura-rpc.dwellir.com",
      // laminar
      "wss://karura-rpc-0.aca-api.network",
      "wss://karura-rpc-1.aca-api.network",
      "wss://karura-rpc-2.aca-api.network/ws",
      "wss://karura-rpc-3.aca-api.network/ws",
      // pw
      "wss://karura.polkawallet.io",
    ],
  },
  telemetryUrl: "wss://feed.telemetry.polkadot.io/feed",
  nodeIDs: {
    Acala: [
      // bootnode
      "12D3KooWALr3yVfDZKn3zg9LuL7mGXg94oT4fxEJfAgierZZTCNn",
      "12D3KooWApQeoWSJN8KmMuE89pyYbDd8b19vpPw8rceoWTVBom6F",
      // collator
      "12D3KooWQgnFYXvStWbVuzw93jNe4ZCVE2rhvD7oHMruosEAQEXp",
      "12D3KooWFg8tvJQtdf2hCm3mjM1djzXo3YCBn6veHFCWWQMh8BbU",
      "12D3KooWQjRgH6JVzpLfYNCmxKfd5dCwGEzHL7KSaeqqPbmZpHU6",
      "12D3KooWSMyrApCoeAvDXk3JTuZjtes6jutkjrkLHPDY5whPjwAe",
      // rpc
      "12D3KooWBLwm4oKY5fsbkdSdipHzYJJHSHhuoyb1eTrH31cidrnY",
      "12D3KooWKapuzLADXUrshtZnD3F13E2WEDr8eonZ23qJSvPXBuDy",
      "12D3KooWEjEBbzk4rptYecG9AHDpadnJHVFsqddGMm9HYZ2Qv9SB",
      "12D3KooW9zA76CH3jAhaiWLykjLoLcisfFpQxLCUuKVWYRS9on7b",
      // pw
      "12D3KooWSJgcCL77PuTHBNTJ9quNhM81Ya2ihFPx4kRVB4NVCkoJ",
      "12D3KooW9xByBxMhdFQz8hLLCFvtR2UJ3UpAqvdPP1X4FziXe7VH",
      "12D3KooWPqh1yszHoP4PSdLomwk8USVVxpet2dubsuMPasAm6EZL",
      "12D3KooWQx4ovK8Y4RyoSaNUvjCWjeiNfzTadGUhJhR1faKRzhxq",
    ],
    Karura: [
      // bootnode
      "12D3KooW9zA76CH3jAhaiWLykjLoLcisfFpQxLCUuKVWYRS9on7b",
      "12D3KooWMosCgKRA18CVozYg3QhWvEEV85iqAaN7FcENavgUs4vm",
      // collator
      "12D3KooWSkMSZt4b3yYbb4m8XUEM2JFn7fZMwF4XKDiPZvmHpHiR",
      "12D3KooWEqYtEPrA9ZV47xancmXRZfzTtnjsfwjQvc9z2K2hgXNr",
      "12D3KooWJwWs9PBi68JpACAMoepf7QJwp4gs97F5MD51EFWrWSBg",
      "12D3KooWLh3cxChQ7xfYDaYA6R62UT8NwC7pYngUpyA7wK3nSiPo",
      // rpc
      "12D3KooWAwq8WtLZWw5XdKXDRyqjVPgZVRuoykHBzRwwPKsjuJbt",
      "12D3KooWNJap7qWykri6tb5fzcjjFMCvPKNYuQDF5883vrzcGzDz",
      "12D3KooWL1Y3oypd99XANhwcHNnenG7GyTFBN2y7XHBoYY3kinqY",
      "12D3KooWH42pWUQ3xnDfLqe2KkoUeCRYHJQT9SufJiWbroNXzGi5",
      // pw
      "12D3KooWEqm3GyKpnuiGN8tfUXEhJReeF2XHts9Z61CwXhaeUyZZ",
      "12D3KooWN7Sr8zU7zG6YLoVehJVC9FgdQe8pEzngMaVgRSVWSYys",
      "12D3KooWP52ERCJNxWq8tXBESM9hyt1TMXAnBPWdqbuCBbW3whrv",
      "12D3KooWPbEn7w2w7ZMirjFvh3Ppm3GBcSnCtKygs8npdkH5yDLh",
    ],
  },
};
