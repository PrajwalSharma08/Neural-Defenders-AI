export function parseURL(urlString) {
  try {
    const url = new URL(urlString);
    const searchParams = {};
    for (const [key, value] of url.searchParams.entries()) {
      if (!searchParams[key]) {
        searchParams[key] = [];
      }
      searchParams[key].push(value);
    }
    
    return {
      href: url.href,
      protocol: url.protocol,
      scheme: url.protocol.replace(':', ''),
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      search: url.search,
      searchParams: searchParams,
      hash: url.hash,
      fragment: url.hash.replace('#', ''),
      origin: url.origin,
      isValid: true
    };
  } catch (e) {
    return null;
  }
}

export function isValidURL(str) {
  try {
    new URL(str);
    return true;
  } catch (e) {
    return false;
  }
}

export function isShortURL(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const shorteners = [
      'bit.ly', 't.co', 'tinyurl.com', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 
      'j.mp', 'rb.gy', 'shorturl.at', 'cutt.ly', 'bl.ink', 'short.io', 
      'rebrand.ly', 'lnkd.in', 'amzn.to', 'youtu.be', 'v.gd', 'po.st', 
      'dlvr.it', 'soo.gd', 's.id', 'qr.ae', 'zpr.io', 'clck.ru', 'x.co', 
      'su.pr', 'mcaf.ee', 'aka.ms', '1drv.ms'
    ];
    return shorteners.includes(host);
  } catch (e) {
    return false;
  }
}

export function getTrackingParams() {
  return [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id', 'utm_cid',
    'fbclid', 'fb_action_ids', 'fb_action_types', 'fb_source', 'fb_ref', 'fref',
    'gclid', 'gclsrc', 'dclid', 'gs_l', 'gs_lcp',
    'msclkid',
    '_hsenc', '_hsmi', '__hstc', '__hsfp', 'hsCtaTracking',
    'mc_cid', 'mc_eid',
    '_bta_tid', '_bta_c',
    'ref', 'ref_', 'referrer', 'sref', 'clickid', 'click_id', 'tracking_id', 'trk', 'track', 'campaign_id', 'ad_id', 'adid', 'ad', 'adgroup', 'adgroupid', 'keyword', 'matchtype', 'network', 'device', 'devicemodel', 'creative', 'placement', 'target', 'si', 'spm', 'scm', 'aff_id', 'aff_sub', 'affiliate', 'aff', 'cid', 'yclid', '_openstat', 'wt_mc', 'wtmc', 'ns_mchannel', 'ns_source', 'ns_campaign', 'ns_linkname', 'ns_fee', 'mkt_tok', 'igshid', 's_kwcid', 'efid', 'epik', 'pp', 'source', 'algo_pvid', 'algo_expid', 'btsid', 'ws_ab_test', 'pdp_ext', 'realtrack'
  ];
}

export function findTrackingParams(urlString) {
  try {
    const url = new URL(urlString);
    const trackingParams = getTrackingParams();
    const found = [];
    const keysToDelete = [];
    
    for (const [key, value] of url.searchParams.entries()) {
      if (trackingParams.includes(key.toLowerCase())) {
        found.push({ name: key, value });
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => url.searchParams.delete(key));
    
    return {
      found,
      cleanUrl: url.toString()
    };
  } catch (e) {
    return { found: [], cleanUrl: urlString };
  }
}

export function buildURLFromParts(parts) {
  if (!parts) return '';
  let urlStr = '';
  if (parts.protocol) urlStr += parts.protocol + '//';
  if (parts.hostname) urlStr += parts.hostname;
  if (parts.port) urlStr += ':' + parts.port;
  if (parts.pathname) urlStr += parts.pathname;
  if (parts.search) urlStr += parts.search;
  if (parts.hash) urlStr += parts.hash;
  return urlStr;
}
