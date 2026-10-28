import numpy as np, wave
SR=44100; T=94; OFF=1.0; BPM=120; beat=60/BPM
N=SR*T; L=np.zeros(N); R=np.zeros(N)
t_all=np.arange(N)/SR
def add(sig,start,pan=0.0,gain=1.0):
    i=int(start*SR); j=min(N,i+len(sig)); s=sig[:j-i]*gain
    L[i:j]+=s*(1-pan)/1.0*0.5+s*0.5*(pan<=0); R[i:j]+=s*(1+pan)/1.0*0.5+s*0.5*(pan>=0)
def env(n,a=0.005,d=0.2):
    t=np.arange(n)/SR; return np.minimum(1,t/a)*np.exp(-t/d)
def kick():
    n=int(.4*SR); t=np.arange(n)/SR; f=50+120*np.exp(-t*30); ph=2*np.pi*np.cumsum(f)/SR
    return np.sin(ph)*np.exp(-t*7)
def clap():
    n=int(.25*SR); t=np.arange(n)/SR; x=np.random.randn(n)
    e=np.exp(-t*25)+.6*np.exp(-np.maximum(0,t-.012)*25)*(t>.012)
    return np.convolve(x,[1,-.9],'same')*e*.5
def hat(o=False):
    n=int((.25 if o else .06)*SR); t=np.arange(n)/SR; x=np.random.randn(n); x=np.diff(np.r_[0,x])
    return x*np.exp(-t*(10 if o else 60))*.25
def note(f,dur,typ='saw',d=.3,a=.005):
    n=int(dur*SR); t=np.arange(n)/SR
    if typ=='saw': s=sum(np.sin(2*np.pi*f*k*t)/k for k in range(1,8))
    elif typ=='sq': s=sum(np.sin(2*np.pi*f*k*t)/k for k in range(1,8,2))
    else: s=np.sin(2*np.pi*f*t)
    return s*env(n,a,d)
mid=lambda m:440*2**((m-69)/12)
chords=[[60,64,67],[55,59,62],[57,60,64],[53,57,60]]  # C G Am F
bass=[36,31,33,29]
bar=4*beat
np.random.seed(1)
for b in range(-1,int(T/bar)):
    st=OFF+b*bar; ch=chords[b%4]
    if st<0: st=0
    full = (5<=st<39) or (43<=st<86); build = 39<=st<43; outro = st>=86
    # pad
    for m in ch:
        n=int(bar*SR); tt=np.arange(n)/SR
        pad=sum(np.sin(2*np.pi*mid(m+12)*k*tt*(1+.002*k))/k**1.5 for k in range(1,5))
        pad*=np.minimum(1,tt/.3)*np.minimum(1,(bar-tt)/.3)
        add(pad,st,gain=.05 if full else .07)
    # arp 16ths
    seq=[ch[0],ch[1],ch[2],ch[1]+12-12+12]
    for k in range(16):
        m=[ch[0]+12,ch[1]+12,ch[2]+12,ch[0]+24][k%4]
        add(note(mid(m),beat/4,'sq',d=.09),st+k*beat/4,pan=(.4 if k%2 else -.4),gain=.06 if not full else .07)
    if full or outro:
        for k in range(4):
            add(kick(),st+k*beat,gain=.9)
            add(note(mid(bass[b%4]),beat*.45,'saw',d=.2),st+k*beat+beat/2,gain=.22)
            add(note(mid(bass[b%4]),beat*.45,'saw',d=.2),st+k*beat,gain=.18)
            if k%2: add(clap(),st+k*beat,gain=.7)
            for h in range(2): add(hat(h==1),st+k*beat+h*beat/2,pan=.3,gain=.6)
        # lead hook every other bar
        if b%2==0:
            mel=[ch[2]+12,ch[1]+12,ch[2]+12,ch[0]+24,ch[2]+12,ch[1]+12]
            for k,m in enumerate(mel): add(note(mid(m),beat*.5,'saw',d=.18,a=.01),st+k*beat*.5+beat,gain=.05)
    if build:
        for k in range(int(bar/(beat/4))):
            add(hat(),st+k*beat/4,gain=.4+.6*k/16)
# riser + snare roll into drop at 9s
n=int(4*SR); tt=np.arange(n)/SR; noise=np.random.randn(n)*(tt/4)**2*.25
add(noise,39)
for i in range(32):
    tpos=39+4*(1-(1-i/32)**1.6); add(clap(),tpos,gain=.15+.5*i/32)
# impact at drop and at CTA
for at in (5,43,86):
    add(kick(),at,gain=1.2); n=int(2*SR); tt=np.arange(n)/SR; add(np.random.randn(n)*np.exp(-tt*2)*.15,at)
# master
mix=np.stack([L,R],1)
fade=np.ones(N); fi=int(.6*SR); fade[:fi]=np.linspace(0,1,fi); fo=int(2.5*SR); fade[-fo:]=np.linspace(1,0,fo)
mix*=fade[:,None]
mix=np.tanh(mix*1.4); mix/=np.abs(mix).max()*1.12
with wave.open('music.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix*32767).astype(np.int16).tobytes())
print('ok')
