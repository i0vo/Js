const RULE_BASE = {
  type: "http",
  behavior: "classical",
  format: "yaml",
  interval: 86400
};

const HEALTH_CHECK = {
  interval: 300,
  timeout: 3000,
  url: "https://www.gstatic.com/generate_204",
  lazy: true,
  "max-failed-times": 3
};

const RULE_REPO = "https://cdn.jsdelivr.net/gh/i0vo/Js@main/";
const DEFAULT_NODE = "香港HK-B01";

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function preferred(nodes, first) {
  return first && nodes.includes(first)
    ? [first, ...nodes.filter((node) => node !== first)]
    : [...nodes];
}

function main(config) {
  const nodes = unique(
    (Array.isArray(config.proxies) ? config.proxies : []).map((proxy) => proxy.name)
  );

  if (!nodes.length) {
    throw new Error("配置文件中未找到任何代理节点");
  }

  const preferredNodes = preferred(nodes, DEFAULT_NODE);
  const common = ["🚀 智能选路", "⚡ 延迟优选", ...nodes, "DIRECT"];

  config.mode = "rule";
  config.ipv6 = true;
  config["find-process-mode"] = "strict";
  config["unified-delay"] = true;
  config["tcp-concurrent"] = true;
  config["geodata-loader"] = "standard";
  config["geo-auto-update"] = true;
  config["geo-update-interval"] = 24;

  config.profile = {
    ...(config.profile || {}),
    "store-selected": true,
    "store-fake-ip": true
  };

  config.dns = {
    enable: true,
    ipv6: true,
    "enhanced-mode": "fake-ip",
    "fake-ip-range": "198.18.0.1/16",
    "fake-ip-filter": [
      "*.lan",
      "*.local",
      "localhost.ptlogin2.qq.com",
      "*.weixin.qq.com",
      "*.wechat.com",
      "*.servicewechat.com",
      "lens.l.google.com",
      "*.srv.nintendo.net",
      "*.stun.playstation.net",
      "xbox.*.*.microsoft.com",
      "*.xboxlive.com",
      "*.msftncsi.com",
      "*.msftconnecttest.com"
    ],
    "default-nameserver": ["119.29.29.29", "223.5.5.5"],
    nameserver: [
      "https://dns.alidns.com/dns-query",
      "https://doh.pub/dns-query"
    ],
    fallback: [
      "https://1.1.1.1/dns-query",
      "https://8.8.8.8/dns-query"
    ],
    "proxy-server-nameserver": [
      "https://dns.alidns.com/dns-query",
      "https://doh.pub/dns-query"
    ],
    "fallback-filter": { geoip: true, "geoip-code": "CN" }
  };

  config.tun = {
    ...(config.tun || {}),
    "auto-route": true,
    "auto-detect-interface": true
  };

  config.sniffer = {
    enable: true,
    "force-dns-mapping": true,
    "parse-pure-ip": true,
    "override-destination": false,
    sniff: {
      TLS: { ports: [443, 8443] },
      HTTP: { ports: [80, "8080-8880"] },
      QUIC: { ports: [443, 8443] }
    },
    "force-domain": [],
    "skip-domain": ["Mijia Cloud", "+.oray.com"]
  };

  config["proxy-groups"] = [
    {
      name: "🚀 智能选路",
      type: "select",
      proxies: [...preferredNodes, "⚡ 延迟优选", "DIRECT"]
    },
    {
      ...HEALTH_CHECK,
      name: "⚡ 延迟优选",
      type: "url-test",
      tolerance: 50,
      proxies: nodes
    },
    { name: "🐧 QQ通信", type: "select", proxies: unique(["DIRECT", ...common]) },
    { name: "💬 微信通信", type: "select", proxies: unique(["DIRECT", ...common]) },
    { name: "🎧 网易音乐", type: "select", proxies: ["🚀 智能选路", "DIRECT", "⚡ 延迟优选", ...nodes] },
    { name: "📺 哔哩哔哩", type: "select", proxies: ["🚀 智能选路", "DIRECT", "⚡ 延迟优选", ...nodes] },
    { name: "✈️ Telegram", type: "select", proxies: common },
    { name: "🌍 国际媒体", type: "select", proxies: common },
    { name: "🪟 微软服务", type: "select", proxies: ["🚀 智能选路", "DIRECT", "⚡ 延迟优选", ...nodes] },
    { name: "🤖 AI 服务", type: "select", proxies: common },
    { name: "🧹 广告净化", type: "select", proxies: ["REJECT", "DIRECT"] },
    { name: "🐟 最终兜底", type: "select", proxies: common }
  ];

  config.rules = [
    "RULE-SET,Advertising,🧹 广告净化",
    "RULE-SET,WeChat,💬 微信通信",
    "RULE-SET,QQ,🐧 QQ通信",
    "RULE-SET,NetEaseMusic,🎧 网易音乐",
    "RULE-SET,BiliBili,📺 哔哩哔哩",
    "RULE-SET,Telegram,✈️ Telegram",
    "RULE-SET,GlobalAI,🤖 AI 服务",
    "RULE-SET,GlobalSocialMedia,🌍 国际媒体",
    "RULE-SET,Microsoft,🪟 微软服务",
    "RULE-SET,Apple,DIRECT",
    "RULE-SET,Google,🚀 智能选路",
    "RULE-SET,Lan,DIRECT",
    "RULE-SET,ChinaMax,DIRECT",
    "GEOIP,CN,DIRECT,no-resolve",
    "RULE-SET,Global,🚀 智能选路",
    "MATCH,🐟 最终兜底"
  ];

  const customRules = {
    QQ: "QQ_All_Classical.yaml",
    WeChat: "WeChat_All_Classical.yaml",
    BiliBili: "BiliBili_All_Classical.yaml",
    NetEaseMusic: "NetEaseMusic_All_Classical.yaml",
    Telegram: "Telegram_All_Classical.yaml",
    GlobalSocialMedia: "GlobalSocialMedia_All_Classical.yaml",
    Microsoft: "Microsoft_All_Classical.yaml",
    GlobalAI: "GlobalAI_All_Classical.yaml",
    Advertising: "Advertising_Block_All_Classical.yaml"
  };

  const upstreamRules = {
    Apple: "Apple/Apple_Classical_No_Resolve.yaml",
    Google: "Google/Google_No_Resolve.yaml",
    Lan: "Lan/Lan.yaml",
    ChinaMax: "ChinaMax/ChinaMax_Classical_No_Resolve.yaml",
    Global: "Global/Global_Classical_No_Resolve.yaml"
  };

  const customProviders = Object.fromEntries(
    Object.entries(customRules).map(([name, file]) => [
      name,
      {
        ...RULE_BASE,
        url: RULE_REPO + file,
        path: "./ruleset/" + name + ".yaml"
      }
    ])
  );

  const upstreamProviders = Object.fromEntries(
    Object.entries(upstreamRules).map(([name, path]) => [
      name,
      {
        ...RULE_BASE,
        url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/" + path,
        path: "./ruleset/" + name + ".yaml"
      }
    ])
  );

  config["rule-providers"] = { ...customProviders, ...upstreamProviders };
  return config;
}

