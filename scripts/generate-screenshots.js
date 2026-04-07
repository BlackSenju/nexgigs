const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const W = 1080, H = 1920;
const ORANGE = '#FF4D00', BLACK = '#0a0a0a', STEEL = '#2D2D2D', WHITE = '#FFFFFF', GRAY = '#9ca3af';
const OUT = 'C:\\Users\\jevau_gsp3lw9\\Downloads\\NexGigs-PlayStore';
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
}

// Screenshot 1: Hero
const c1 = createCanvas(W, H);
const x1 = c1.getContext('2d');
x1.fillStyle = BLACK; x1.fillRect(0,0,W,H);
x1.fillStyle = '#111'; x1.fillRect(0,0,W,108);
x1.fillStyle = ORANGE; x1.font = 'bold 28px Arial'; x1.fillText('NexGigs', 60, 75);
x1.font = '900 72px Arial';
x1.fillStyle = WHITE; x1.fillText('Your city.', 60, 280);
x1.fillStyle = ORANGE; x1.fillText('Your skill.', 60, 370);
x1.fillStyle = WHITE; x1.fillText('Your money.', 60, 460);
x1.fillStyle = GRAY; x1.font = '400 22px Arial';
x1.fillText('NexGigs is where everyday people earn', 60, 530);
x1.fillText('money from their skills. Haircuts, coding,', 60, 560);
x1.fillText('landscaping \u2014 if you can do it, someone', 60, 590);
x1.fillText('nearby needs it.', 60, 620);
rr(x1, 60, 680, 400, 56, 12); x1.fillStyle = ORANGE; x1.fill();
x1.fillStyle = WHITE; x1.font = 'bold 20px Arial'; x1.textAlign = 'center';
x1.fillText('Start Earning  \u2192', 260, 714); x1.textAlign = 'left';
rr(x1, 500, 680, 280, 56, 12); x1.strokeStyle = '#555'; x1.lineWidth = 2; x1.stroke();
x1.fillStyle = WHITE; x1.textAlign = 'center'; x1.fillText('Post a Job', 640, 714); x1.textAlign = 'left';
x1.fillStyle = WHITE; x1.font = '900 36px Arial'; x1.fillText('What do you need done?', 60, 850);
x1.fillStyle = GRAY; x1.font = '400 18px Arial'; x1.fillText('Browse gigs across dozens of categories', 60, 890);
const cats = ['Home & Yard','Personal Errands','Creative & Digital','Events','Food & Cooking','Tech Help','Auto & Vehicle','Hair & Beauty','Fitness & Wellness','Transportation','Tutoring','Trades (Licensed)'];
for (let i = 0; i < cats.length; i++) {
  const col = i % 2, row = Math.floor(i / 2);
  const cx = 60 + col * 490, cy = 940 + row * 90;
  rr(x1, cx, cy, 460, 75, 16); x1.fillStyle = STEEL; x1.fill();
  x1.fillStyle = WHITE; x1.font = '500 18px Arial'; x1.fillText(cats[i], cx + 20, cy + 45);
}
fs.writeFileSync(path.join(OUT, '01-hero-landing.png'), c1.toBuffer('image/png'));
console.log('Created: 01-hero-landing.png');

// Screenshot 2: Job Feed
const c2 = createCanvas(W, H);
const x2 = c2.getContext('2d');
x2.fillStyle = BLACK; x2.fillRect(0,0,W,H);
x2.fillStyle = '#111'; x2.fillRect(0,0,W,108);
x2.fillStyle = ORANGE; x2.font = 'bold 28px Arial'; x2.fillText('NexGigs', 60, 75);
x2.fillStyle = WHITE; x2.font = 'bold 16px Arial'; x2.fillText('Milwaukee, WI  10 mi', 85, 150);
x2.fillStyle = GRAY; x2.font = '400 14px Arial'; x2.textAlign = 'right'; x2.fillText('8 gigs nearby', W-60, 150); x2.textAlign = 'left';
rr(x2, 60, 175, W-120, 48, 12); x2.fillStyle = STEEL; x2.fill();
x2.fillStyle = '#666'; x2.font = '400 16px Arial'; x2.fillText('Search gigs...', 100, 205);
const pills = ['All','Home & Yard','Creative','Tech Help'];
let px = 60;
pills.forEach(function(p,i) { var pw = 30 + p.length * 10; rr(x2, px, 245, pw, 36, 18); x2.fillStyle = i===0?ORANGE:STEEL; x2.fill(); x2.fillStyle = WHITE; x2.font = '500 14px Arial'; x2.textAlign = 'center'; x2.fillText(p, px+pw/2, 268); x2.textAlign = 'left'; px += pw + 10; });
var jobs = [
  {cat:'Home & Yard',urg:true,title:'Need lawn mowed + hedges trimmed',desc:'Front and back yard needs mowing. Hedges along the driveway...',price:'$75',poster:'Sarah M.  4.8',apps:'3 applicants',time:'30m ago'},
  {cat:'Creative & Digital',urg:false,title:'Logo design for new food truck',desc:'Starting a food truck \u2014 need a bold, colorful logo...',price:'$100\u2013$250',poster:'Marcus J.  4.5',apps:'7 applicants',time:'2h ago'},
  {cat:'Personal Errands',urg:true,title:'Help moving furniture to apartment',desc:'Moving from 1st to 3rd floor. Need 2 people...',price:'$150',poster:'Tanya R.',apps:'1 applicant',time:'1h ago'},
  {cat:'Hair & Beauty',urg:false,title:'Braids \u2014 knotless box braids',desc:'Looking for someone experienced in knotless box braids...',price:'$120\u2013$180',poster:'Destiny K.  5.0',apps:'5 applicants',time:'4h ago'},
];
var jy = 310;
jobs.forEach(function(j) {
  rr(x2, 60, jy, W-120, 260, 16); x2.fillStyle = STEEL; x2.fill();
  x2.fillStyle = ORANGE; x2.font = '600 12px Arial'; x2.fillText(j.cat, 80, jy+30);
  if(j.urg){x2.fillStyle='#FF1A1A';x2.fillText('Urgent', 250, jy+30);}
  x2.fillStyle=GRAY;x2.font='400 12px Arial';x2.textAlign='right';x2.fillText(j.time,W-80,jy+30);x2.textAlign='left';
  x2.fillStyle=WHITE;x2.font='bold 20px Arial';x2.fillText(j.title,80,jy+65);
  x2.fillStyle=GRAY;x2.font='400 15px Arial';x2.fillText(j.desc,80,jy+95);
  x2.fillStyle=WHITE;x2.font='900 26px Arial';x2.fillText(j.price,80,jy+155);
  x2.fillStyle=GRAY;x2.font='400 14px Arial';x2.textAlign='right';x2.fillText(j.poster,W-80,jy+150);x2.textAlign='left';
  x2.fillStyle='#555';x2.font='400 12px Arial';x2.fillText(j.apps,80,jy+195);
  jy += 280;
});
x2.fillStyle='#111';x2.fillRect(0,H-70,W,70);
fs.writeFileSync(path.join(OUT, '02-job-feed.png'), c2.toBuffer('image/png'));
console.log('Created: 02-job-feed.png');

// Screenshot 3: Signup
const c3 = createCanvas(W, H);
const x3 = c3.getContext('2d');
x3.fillStyle = BLACK; x3.fillRect(0,0,W,H);
x3.fillStyle = ORANGE; x3.font = 'bold 36px Arial'; x3.textAlign = 'center'; x3.fillText('NexGigs', W/2, 250);
x3.fillStyle = WHITE; x3.font = '900 42px Arial'; x3.fillText('Join NexGigs', W/2, 330);
x3.fillStyle = GRAY; x3.font = '400 20px Arial'; x3.fillText('How do you want to get started?', W/2, 375); x3.textAlign = 'left';
rr(x3, 60, 440, W-120, 140, 20); x3.fillStyle = STEEL; x3.fill();
x3.fillStyle = WHITE; x3.font = 'bold 22px Arial'; x3.fillText('I want to earn', 190, 500);
x3.fillStyle = GRAY; x3.font = '400 16px Arial'; x3.fillText('Find gigs in your city and get paid for your skills', 190, 535);
rr(x3, 60, 610, W-120, 140, 20); x3.fillStyle = STEEL; x3.fill();
x3.fillStyle = WHITE; x3.font = 'bold 22px Arial'; x3.fillText('I need help', 190, 670);
x3.fillStyle = GRAY; x3.font = '400 16px Arial'; x3.fillText('Post jobs and hire talented people in your area', 190, 705);
rr(x3, 60, 830, W-120, 56, 12); x3.fillStyle = STEEL; x3.fill();
x3.fillStyle = WHITE; x3.font = '500 18px Arial'; x3.textAlign = 'center'; x3.fillText('G  Sign up with Google', W/2, 864); x3.textAlign = 'left';
fs.writeFileSync(path.join(OUT, '03-signup.png'), c3.toBuffer('image/png'));
console.log('Created: 03-signup.png');

// Screenshot 4: Profile
const c4 = createCanvas(W, H);
const x4 = c4.getContext('2d');
x4.fillStyle = BLACK; x4.fillRect(0,0,W,H);
x4.fillStyle = '#111'; x4.fillRect(0,0,W,108);
x4.fillStyle = ORANGE; x4.font = 'bold 28px Arial'; x4.fillText('NexGigs', 60, 75);
x4.beginPath(); x4.arc(130, 230, 55, 0, Math.PI*2); x4.fillStyle = '#444'; x4.fill();
x4.fillStyle = GRAY; x4.font = '900 36px Arial'; x4.textAlign = 'center'; x4.fillText('MJ', 130, 243); x4.textAlign = 'left';
x4.fillStyle = WHITE; x4.font = 'bold 26px Arial'; x4.fillText('Marcus J.', 210, 215);
x4.fillStyle = ORANGE; x4.font = '400 14px Arial'; x4.fillText('ID Verified', 210, 245);
x4.fillStyle = '#22c55e'; x4.fillText('BG Checked', 320, 245);
x4.fillStyle = GRAY; x4.font = '400 16px Arial'; x4.fillText('Third Ward, Milwaukee, WI', 210, 275);
x4.fillStyle = ORANGE; x4.font = 'bold 14px Arial'; x4.fillText('Lvl 5 \u2014 Pro Gigger', 210, 300);
rr(x4, 60, 340, 460, 48, 12); x4.fillStyle = ORANGE; x4.fill();
x4.fillStyle = WHITE; x4.font = 'bold 18px Arial'; x4.textAlign = 'center'; x4.fillText('Message', 290, 370); x4.textAlign = 'left';
rr(x4, 550, 340, 460, 48, 12); x4.strokeStyle = '#555'; x4.lineWidth = 2; x4.stroke();
x4.fillStyle = WHITE; x4.textAlign = 'center'; x4.fillText('Hire Directly', 780, 370); x4.textAlign = 'left';
var sts = [{v:'31',l:'Gigs'},{v:'19',l:'5-Star'},{v:'96%',l:'Rehire'},{v:'8200',l:'XP',c:ORANGE}];
sts.forEach(function(s,i) { var sx = 60 + i*250; rr(x4, sx, 420, 220, 100, 16); x4.fillStyle = STEEL; x4.fill(); x4.fillStyle = s.c||WHITE; x4.font = '900 32px Arial'; x4.textAlign = 'center'; x4.fillText(s.v, sx+110, 465); x4.fillStyle = GRAY; x4.font = '400 14px Arial'; x4.fillText(s.l, sx+110, 495); x4.textAlign = 'left'; });
x4.fillStyle = WHITE; x4.font = 'bold 18px Arial'; x4.fillText('About', 60, 575);
x4.fillStyle = GRAY; x4.font = '400 16px Arial';
x4.fillText('Graphic designer and digital artist with 5+ years of experience.', 60, 605);
x4.fillText('Logos, brand identity, social media content, and murals.', 60, 630);
x4.fillStyle = WHITE; x4.font = 'bold 18px Arial'; x4.fillText('Skills', 60, 685);
var skx = 60;
['Logo Design 5y','Brand Identity 4y','Social Media 3y','Mural Art 2y'].forEach(function(sk) { var skw = 14 + sk.length * 9; rr(x4, skx, 705, skw, 36, 10); x4.fillStyle = '#333'; x4.fill(); x4.fillStyle = '#ccc'; x4.font = '400 14px Arial'; x4.fillText(sk, skx+12, 728); skx += skw + 10; });
x4.fillStyle = WHITE; x4.font = 'bold 18px Arial'; x4.fillText('Portfolio', 60, 800);
for(var i=0;i<6;i++){var col=i%3,row=Math.floor(i/3);rr(x4,60+col*325,830+row*325,300,300,16);x4.fillStyle='#333';x4.fill();}
x4.fillStyle = WHITE; x4.font = 'bold 18px Arial'; x4.fillText('Reviews (24)', 60, 1520);
rr(x4, 60, 1545, W-120, 130, 16); x4.fillStyle = STEEL; x4.fill();
x4.fillStyle = WHITE; x4.font = 'bold 16px Arial'; x4.fillText('Sarah M.', 80, 1580);
x4.fillStyle = ORANGE; x4.fillText('5.0', 220, 1580);
x4.fillStyle = GRAY; x4.font = '400 15px Arial';
x4.fillText('Marcus absolutely killed the logo design. Quick turnaround', 80, 1615);
x4.fillText('and nailed the vibe on the first try. Highly recommend.', 80, 1640);
fs.writeFileSync(path.join(OUT, '04-profile.png'), c4.toBuffer('image/png'));
console.log('Created: 04-profile.png');

// Feature graphic
async function featureGraphic() {
  const c = createCanvas(1024, 500);
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0,0,1024,500);
  grad.addColorStop(0,'#1a0800'); grad.addColorStop(1,BLACK);
  ctx.fillStyle = grad; ctx.fillRect(0,0,1024,500);
  try { const icon = await loadImage(path.join(__dirname, '..', 'public', 'icons', 'fist-original.jpg')); ctx.drawImage(icon,60,130,220,220); } catch(e){ console.log('Icon load skipped'); }
  ctx.fillStyle = WHITE; ctx.font = '900 64px Arial'; ctx.fillText('NexGigs', 320, 240);
  ctx.fillStyle = ORANGE; ctx.font = '400 28px Arial'; ctx.fillText('Your city. Your skill. Your money.', 320, 290);
  ctx.fillStyle = GRAY; ctx.font = '400 20px Arial'; ctx.fillText('Hyperlocal gig economy marketplace', 320, 340);
  fs.writeFileSync(path.join(OUT, 'feature-graphic-1024x500.png'), c.toBuffer('image/png'));
  console.log('Created: feature-graphic-1024x500.png');
}

// Copy icon
try {
  fs.copyFileSync(path.join(__dirname, '..', 'public', 'icons', 'icon-512.png'), path.join(OUT, 'app-icon-512x512.png'));
  console.log('Copied: app-icon-512x512.png');
} catch(e) { console.log('Icon copy skipped'); }

featureGraphic().then(function() { console.log('\nAll files saved to: Downloads/NexGigs-PlayStore/'); });
