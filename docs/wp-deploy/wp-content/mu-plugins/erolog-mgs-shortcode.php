<?php
/**
 * Plugin Name: Erolog MGS Shortcode
 * Description: MGS 連動広告。REST 投稿では script が剥がれるため [erolog_mgs] で出力。
 * Version: 1.0.0
 */

defined('ABSPATH') || exit;

/** erolog_article.py の MGS_AFFILIATE_ID / クエリと同期 */
const EROLOG_MGS_AFFILIATE_ID = 'PHUD85LRHHCYILLYEXO3NCQ3I7';

const EROLOG_MGS_SCRIPT_QUERY =
    'da=&ma=' . EROLOG_MGS_AFFILIATE_ID
    . '&tag=entryTags&pch=2&n=&rn=&spn=&sprn=&ms=&mw=&mw2=&mt=&mcl=&mbg=&mc=&msz='
    . '&ts=&tt=&tcl=&tbg=&tsz=&tlh=&tc=&tmc=&tu=&lts=&ltt=&ltcl=&ltbg=&ltsz=&ltr='
    . '&ltlh=&ltc=&ltmc=&ltu=&ds=&dt=&dcl=&dsz=&dlh=&dc=&lds=&ldt=&ldcl=&ldsz=&ldr='
    . '&ldlh=&ldc=&ids=&idss=&ib=&ibs=&ibc=&ir=&irs=&ls=&lsbg=&lsc=&sf=';

function erolog_mgs_script_src(): string
{
    return '//kok.eroterest.net/origin/?' . EROLOG_MGS_SCRIPT_QUERY;
}

function erolog_mgs_enqueue_script(): void
{
    static $done = false;
    if ($done) {
        return;
    }
    $done = true;
    $src = erolog_mgs_script_src();
    echo '<script src="' . esc_attr($src) . '"></script>' . "\n";
}

/**
 * 本文に div を置き、script は wp_footer で1回だけ出力（KSES 回避）。
 *
 * @return string
 */
function erolog_mgs_shortcode(): string
{
    add_action('wp_footer', 'erolog_mgs_enqueue_script', 20);
    return '<div id="erKokOrigin" class="erKokOrigin"></div>';
}

add_shortcode('erolog_mgs', 'erolog_mgs_shortcode');
