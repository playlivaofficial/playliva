import Image from 'next/image'

/** Original Rio scenery and the owner-selected Ipanema aircraft artwork. */
export function RioArt() {
  return <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="avia-sky" x2="0" y2="1"><stop stopColor="#454378"/><stop offset=".48" stopColor="#ec998c"/><stop offset=".8" stopColor="#ffc988"/><stop offset="1" stopColor="#ffe6ae"/></linearGradient>
      <linearGradient id="avia-sea" x2=".8" y2="1"><stop stopColor="#47b2af"/><stop offset=".5" stopColor="#167b8d"/><stop offset="1" stopColor="#143d61"/></linearGradient>
      <linearGradient id="avia-rock" x2="1" y2=".6"><stop stopColor="#436c77"/><stop offset=".48" stopColor="#345966"/><stop offset=".5" stopColor="#234655"/><stop offset="1" stopColor="#1d394f"/></linearGradient>
      <linearGradient id="avia-shore" x2="0" y2="1"><stop stopColor="#194e5a"/><stop offset="1" stopColor="#0c263d"/></linearGradient>
      <radialGradient id="avia-glow"><stop stopColor="#ffdfa9" stopOpacity=".7"/><stop offset="1" stopColor="#ffdf99" stopOpacity="0"/></radialGradient>
      <linearGradient id="avia-sunpath" x2="0" y2="1"><stop stopColor="#ffe3ab" stopOpacity=".7"/><stop offset="1" stopColor="#efc0a1" stopOpacity="0"/></linearGradient>
    </defs>
    <path fill="url(#avia-sky)" d="M0 0h1200v800H0z"/>
    <circle cx="820" cy="305" r="265" fill="url(#avia-glow)"/><circle cx="820" cy="305" r="65" fill="#ffe8b5" opacity=".94"/>
    <path d="M0 411Q82 332 145 400Q203 307 260 365Q331 226 410 328Q460 269 503 343Q541 301 600 390Q655 291 702 382Q755 342 821 399L1200 419V535H0Z" fill="#756981" opacity=".5"/>
    <path d="M0 462Q95 349 178 423Q240 357 288 411Q380 310 445 390Q499 369 552 454Q600 391 666 434Q750 373 817 439L1200 452V560H0Z" fill="#456b7b" opacity=".65"/>
    <path fill="url(#avia-sea)" d="M0 458H1200V800H0Z"/>
    <path d="M782 467L864 467L991 733L651 733Z" fill="url(#avia-sunpath)" opacity=".65"/>
    {Array.from({ length: 26 }, (_, i) => <path key={i} d={`M${690 - i * 5 + (i % 3) * 28} ${485 + i * 9}h${220 + i * 5}`} stroke="#ffeac4" strokeWidth={i % 2 ? 1 : 3} opacity={.16 - i * .004}/ >)}
    <path d="M760 493C810 453 835 454 858 408C876 373 885 310 910 298C951 278 972 339 981 394C990 443 1038 454 1085 474L1145 517Z" fill="url(#avia-rock)"/>
    <path d="M910 303C889 363 901 410 864 455L925 482L961 479C925 419 922 376 910 303" fill="#659085" opacity=".32"/>
    <path d="M981 487Q1070 343 1115 377Q1153 338 1200 397V610Z" fill="#234958"/>
    <path d="M0 491C151 475 213 493 246 524C289 563 225 587 181 597C105 614 96 650 164 666C253 688 311 691 330 744L1200 800H0Z" fill="#e8c597"/>
    <path d="M0 503C149 487 189 502 222 524C272 559 164 574 130 601C57 657 166 695 234 702C297 708 295 736 298 767L1200 800H0Z" fill="url(#avia-shore)"/>
    <path d="M248 527C288 566 229 593 178 607C105 628 111 652 174 669C258 692 314 692 338 744" fill="none" stroke="#d1f5d8" strokeWidth="5" opacity=".7"/>
    {Array.from({ length: 28 }, (_, i) => {
      const x = (i * 71) % 234 - 20, y = 511 + Math.floor(i / 7) * 38, h = 18 + (i * 13) % 38
      return <g key={i}><path d={`M${x} ${y}v-${h}l18 -6v${h}z`} fill={i % 2 ? '#dec6b7' : '#b7c4bc'}/><path d={`M${x + 18} ${y - h - 6}l12 6v${h}l-12 -6z`} fill="#6e8d90"/><path d={`M${x + 4} ${y - h + 5}h9m-9 9h9m-9 9h9`} stroke="#304e61" strokeWidth="3" opacity=".65"/></g>
    })}
    <path d="M0 719Q150 708 220 769L388 800H0Z" fill="#102a3b"/>
    <g fill="none" stroke="#103d46" strokeWidth="7"><path d="M63 797Q80 726 53 667M182 800Q189 754 171 713"/><path d="M54 670q-20 -22 -54 -6m55 6q29 -25 63 -10m-63 10q-28 0 -47 26m46 -26q33 0 56 25m-54 -25q-2 -28 -21 -43M171 715q-28 -16 -51 0m52 0q20 -24 49 -12m-49 12q30 0 44 20"/></g>
    <g fill="#fff0d1" opacity=".7"><path d="m575 575 2 -21 18 21z"/><path d="m575 576h26l-7 5h-15z"/><path d="m997 664 3 -28 21 28z"/><path d="m997 666h33l-10 7h-19z"/></g>
    <g fill="none" stroke="#304b66" strokeWidth="2" opacity=".5"><path d="M340 284q9 -7 17 0q9 -7 17 0M380 307q6 -5 12 0q6 -5 12 0"/></g>
  </svg>
}

export function AviaAircraft() {
  return <Image src="/originals/avia-de-janeiro/aircraft-ipanema.webp" width={1536} height={1024} alt="" aria-hidden="true" draggable={false} priority unoptimized />
}
