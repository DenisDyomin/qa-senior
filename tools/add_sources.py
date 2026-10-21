import sys, re
path = sys.argv[1]
refs = sys.argv[2] if len(sys.argv) > 2 else None
dry = refs is None
s = open(path).read()
pat = re.compile(r'QA\.defineTopic\(\{.*?\n\}\);', re.DOTALL)
blocks = pat.findall(s)
total_define = s.count('QA.defineTopic(')
missing = sum(1 for b in blocks if 'sources:' not in b)
if dry:
    print(f"{path}: defineTopic={total_define} matched={len(blocks)} missing_sources={missing} "
          + ("OK" if len(blocks)==total_define else "!!! MATCH MISMATCH"))
    sys.exit(0)
n=0
def repl(m):
    global n
    b=m.group(0)
    if 'sources:' in b: return b
    n+=1
    return b[:-len('\n});')] + '\n  sources: `\n' + refs + '\n`,\n});'
s2 = pat.sub(repl, s)
open(path,'w').write(s2)
print(f"{path}: injected {n}")
