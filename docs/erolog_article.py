"""エログメモ記事HTML（Blogterest / WordPress 共通）."""

from __future__ import annotations

import html

MGS_AFFILIATE_ID = "PHUD85LRHHCYILLYEXO3NCQ3I7"

MGS_SCRIPT_QUERY = (
    f"da=&ma={MGS_AFFILIATE_ID}"
    "&tag=entryTags&pch=2&n=&rn=&spn=&sprn=&ms=&mw=&mw2=&mt=&mcl=&mbg=&mc=&msz="
    "&ts=&tt=&tcl=&tbg=&tsz=&tlh=&tc=&tmc=&tu=&lts=&ltt=&ltcl=&ltbg=&ltsz=&ltr="
    "&ltlh=&ltc=&ltmc=&ltu=&ds=&dt=&dcl=&dsz=&dlh=&dc=&lds=&ldt=&ldcl=&ldsz=&ldr="
    "&ldlh=&ldc=&ids=&idss=&ib=&ibs=&ibc=&ir=&irs=&ls=&lsbg=&lsc=&sf="
)

MGS_ONE_LINE = (
    '<div id="erKokOrigin" class="erKokOrigin"></div>'
    f'<script src="//kok.eroterest.net/origin/?{MGS_SCRIPT_QUERY}"></script>'
)

# WordPress: mu-plugin erolog-mgs-shortcode.php が wp_footer で script を出力
MGS_WP_SHORTCODE = "[erolog_mgs]"


def _movie_link(video_url: str) -> str:
    url = html.escape(video_url.strip(), quote=True)
    return (
        f'<p><a href="{url}" target="_blank" rel="noopener" class="movieLink">'
        "動画はこちら</a></p>"
    )


def build_html(line1: str, line2: str, video_url: str) -> str:
    """Blogterest htmlソース用（script 直書き）。"""
    line1 = html.escape(line1.strip(), quote=False)
    line2 = html.escape(line2.strip(), quote=False)
    return f"<p>{line1}</p><p>{line2}</p>{MGS_ONE_LINE}{_movie_link(video_url)}"


def build_html_wp(line1: str, line2: str, video_url: str) -> str:
    """WordPress 投稿用。staging では script 直書きでも公開面で MGS 表示OK（Blogterest 同一）。"""
    return build_html(line1, line2, video_url)
