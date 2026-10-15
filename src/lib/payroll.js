export const BASE_SHIFT_HOURS=9;
export const DEFAULT_BASE_PAY_PHP=700;
export const DEFAULT_OVERTIME_RATE_PHP=86;
export function calculatePay(startedAt,endedAt=new Date(),settings={}) {
 const baseHours=Number(settings.base_shift_hours??BASE_SHIFT_HOURS),basePay=Number(settings.base_pay_php??DEFAULT_BASE_PAY_PHP),rate=Number(settings.overtime_hourly_php??DEFAULT_OVERTIME_RATE_PHP);
 const minutes=Math.max(0,Math.floor((new Date(endedAt).getTime()-new Date(startedAt).getTime())/60000));
 const otMinutes=Math.max(0,minutes-baseHours*60),earned=minutes>=baseHours*60?basePay:minutes/(baseHours*60)*basePay,otPay=otMinutes/60*rate;
 return {elapsedMinutes:minutes,regularHours:Math.min(baseHours,minutes/60),overtimeMinutes:otMinutes,basePay:Math.round(earned*100)/100,overtimePay:Math.round(otPay*100)/100,total:Math.round((earned+otPay)*100)/100};
}
export function getPayrollPeriod(date=new Date()) {
 const y=date.getFullYear(),m=date.getMonth(),d=date.getDate(),start=new Date(y,m,d<=15?1:16),end=d<=15?new Date(y,m,15):new Date(y,m+1,0);
 const fmt=x=>`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;
 return {start:fmt(start),end:fmt(end),label:`${start.toLocaleDateString('en-PH',{month:'short',day:'numeric'})}–${end.toLocaleDateString('en-PH',{month:'short',day:'numeric'})}`};
}
