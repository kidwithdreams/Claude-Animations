#!/usr/bin/env python3
"""audio/vo.words.json -> src/captions.js: groups of 2-4 words, one yellow key word each, word-by-word reveal."""
import json, re
W = json.load(open('audio/vo.words.json'))
# preferred key words (first match in a group wins), else the longest non-stopword
KEY = ['friday', 'artyom', 'monday', 'last', 'seventh', 'eighth', 'jerked', 'stopped', 'emergency', 'nothing', 'signal',
       'metal', 'concrete', 'everything', 'battery', '3%', 'help', 'silence', 'force', 'climb', 'dangerous', 'mistake',
       'injuries', 'escape', 'own', 'fall', "won't", 'steel', 'cables', 'snap', 'brakes', 'lock', 'shaft', 'breath', 'panic',
       'building', 'half', 'chocolate', 'airplane', 'off', 'percent', 'screaming', 'energy', 'water', 'knock', 'knocks', '15',
       'answer', 'food', 'weeks', 'three', 'days', 'sip', 'hours', 'saturday', 'again', 'always', 'first', 'someone',
       'answered', 'above', 'laughed', 'out', 'pulled', 'morning', 'frowned', 'guard', 'knocking', 'empty', 'weekend',
       'cameras', 'no', 'key', 'who']
STOP = {'the', 'a', 'an', 'to', 'of', 'and', 'he', 'his', 'it', 'in', 'on', 'was', 'for', 'that', 'him', 'had', 'been', 'but', 'not', 'when', 'so', 'they', 'if', 'can', 'would', 'just', 'like', 'with'}
norm = lambda w: re.sub(r"[^a-z0-9%']", '', w.lower())
# 1) sentences, 2) comma phrases, 3) balanced chunks of 2-4 words that don't end on a small word
sents, cur = [], []
for w in W:
    cur.append(w)
    if re.search(r'[.?!]$', w['w']): sents.append(cur); cur = []
if cur: sents.append(cur)
out = []
for sen in sents:
    phrases, cur = [], []
    for w in sen:
        cur.append(w)
        if re.search(r',$', w['w']): phrases.append(cur); cur = []
    if cur: phrases.append(cur)
    # merge single-word phrases into a neighbour when the result stays <= 4 words
    merged = []
    for ph in phrases:
        if merged and (len(ph) == 1 or len(merged[-1]) == 1) and len(merged[-1]) + len(ph) <= 4: merged[-1] = merged[-1] + ph
        else: merged.append(ph)
    for ph in merged:
        n = len(ph)
        if n <= 4: out.append(ph); continue
        k = -(-n // 4)                      # number of chunks
        sizes = [n // k + (1 if i < n % k else 0) for i in range(k)]
        i = 0
        for j, sz in enumerate(sizes):
            end = i + sz
            # don't end a chunk on a small word: push the boundary one word later if that keeps both sides 2..4
            if j < k - 1 and norm(ph[end - 1]['w']) in STOP:
                if end - 1 - i >= 2 and sizes[j + 1] + 1 <= 4: end -= 1; sizes[j + 1] += 1
                elif sz < 4 and (n - end - 1) >= 2: end += 1; sizes[j + 1] -= 1
            out.append(ph[i:end]); i = end
res = []
used = set()
for gi, g in enumerate(out):
    words = [norm(w['w']) for w in g]
    k = None
    for cand in KEY:
        if cand in words and (cand, gi) not in used:
            k = words.index(cand); break
    if k is None:
        cands = [(len(x), j) for j, x in enumerate(words) if x not in STOP]
        k = max(cands)[1] if cands else len(words) - 1
    end = out[gi + 1][0]['s'] if gi + 1 < len(out) else g[-1]['e'] + 0.3
    end = min(end, g[-1]['e'] + 0.6)
    res.append({'s': round(g[0]['s'], 2), 'e': round(end, 2), 'key': k,
                'w': [[re.sub(r'[.,;:]+$', '', w['w']).upper(), round(w['s'], 2)] for w in g]})
open('src/captions.js', 'w').write('export const CAPTIONS = ' + json.dumps(res) + ';\n')
for r in res:
    print(f"{r['s']:6.2f}-{r['e']:6.2f} " + ' '.join(('*' + w[0] + '*') if j == r['key'] else w[0] for j, w in enumerate(r['w'])))
