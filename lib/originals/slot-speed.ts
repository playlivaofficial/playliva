export function slotTiming(turbo:boolean,game:'capybara'|'golaco'){
 const capy=game==='capybara'
 return turbo?{first:capy?800:700,gap:150,anticipation:capy?560:620,result:400,bonusResult:capy?700:650,bonusWin:capy?1200:1150,intro:capy?2200:2100}:{first:1200,gap:250,anticipation:720,result:850,bonusResult:1000,bonusWin:1600,intro:capy?2200:2100}
}
