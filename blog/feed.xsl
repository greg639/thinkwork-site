<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom" exclude-result-prefixes="atom">
<xsl:output method="html" encoding="UTF-8" indent="yes"/>
<xsl:template match="/">
<html lang="en"><head>
  <meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title><xsl:value-of select="/rss/channel/title"/> — RSS feed</title>
  <style>
    body{margin:0;background:#F7F6F2;color:#0F1623;font:16px/1.6 'IBM Plex Sans',system-ui,sans-serif;}
    .wrap{max-width:680px;margin:0 auto;padding:48px 24px 64px;}
    .eyebrow{font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#1A3D5C;}
    h1{font-family:Georgia,serif;font-size:30px;letter-spacing:-.015em;margin:8px 0 10px;}
    .card{background:#FCFBF8;border:1px solid #DAD7CE;border-radius:12px;padding:20px 22px;margin:22px 0 30px;}
    .card code{display:block;background:#0F1623;color:#F7F6F2;padding:10px 14px;border-radius:8px;
      font:13px ui-monospace,monospace;margin:10px 0;overflow-x:auto;}
    a{color:#1A3D5C;}
    .item{padding:16px 0;border-bottom:1px solid #E5E2D9;}
    .item a{font-weight:600;text-decoration:none;font-size:17px;}
    .item .d{font-size:13px;color:#867E70;margin-top:2px;}
    .muted{font-size:14px;color:#5A6273;}
  </style>
</head><body><div class="wrap">
  <span class="eyebrow">RSS feed</span>
  <h1><xsl:value-of select="/rss/channel/title"/></h1>
  <p class="muted"><xsl:value-of select="/rss/channel/description"/></p>
  <div class="card">
    <p><b>This page is an RSS feed.</b> To subscribe, copy this address into any
    feed reader (Feedly, NetNewsWire, Reeder, Inoreader&#8230;):</p>
    <code>https://thinkwork.info/blog/feed.xml</code>
    <p class="muted">Not a feed-reader person?
    <a href="/blog/#alerts">Get new posts by email instead</a>.</p>
  </div>
  <xsl:for-each select="/rss/channel/item[position() &lt;= 15]">
    <div class="item">
      <a><xsl:attribute name="href"><xsl:value-of select="link"/></xsl:attribute>
        <xsl:value-of select="title"/></a>
      <div class="d"><xsl:value-of select="pubDate"/></div>
    </div>
  </xsl:for-each>
  <p class="muted" style="margin-top:20px;"><a href="/blog/">&#8592; Back to the blog</a></p>
</div></body></html>
</xsl:template>
</xsl:stylesheet>