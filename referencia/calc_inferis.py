"""Calculo de referencia da INFERIS para os exemplos das pecas (fonte unica dos numeros).

Metodologia definida pelo usuario (2026-11-06):
- HOJE: ICMS por dentro (gross-up: o ICMS integra a propria base); PIS e COFINS com a base excluindo o ICMS
  (Tema 69 STF); IPI e ICMS-ST por fora.
- Valor liquido = valor do produto - ICMS - PIS - COFINS.
- 2027: nova base = valor liquido + CBS + IBS. Sobre ela, os tributos nao substituidos: ICMS por dentro
  (gross-up de novo) e ICMS-ST. PIS/COFINS extintos, IPI zerado.
Os valores sao arredondados a centavos em cada linha; subtotais saem da soma das linhas arredondadas.
"""
from decimal import Decimal as D, ROUND_HALF_UP

ICMS = D("0.18")      # aliquota nominal interna
PIS = D("0.0165")     # nao cumulativo
COFINS = D("0.076")   # nao cumulativo
IPI = D("0.10")
MVA = D("0.14")
CBS = D("0.113")      # referencia TCU, TC 006.529/2026-7
IBS = D("0.001")      # 2027: 0,05% estadual + 0,05% municipal (EC 132/2023)
NOTA_HOJE = D("100.00")


def r(x):
    return x.quantize(D("0.01"), ROUND_HALF_UP)


def hoje(total=NOTA_HOJE):
    """Decompoe uma nota de 'total' (com IPI e ICMS-ST por fora)."""
    # total = V + IPI + ST ; IPI = i*V ; ST = ICMS*(V*(1+i)*(1+MVA)) - ICMS*V
    fator = 1 + IPI + ICMS * ((1 + IPI) * (1 + MVA) - 1)
    v = total / fator
    icms = r(ICMS * v)
    pis = r(PIS * (v - ICMS * v))
    cofins = r(COFINS * (v - ICMS * v))
    ipi = r(IPI * v)
    st = r(ICMS * v * (1 + IPI) * (1 + MVA)) - icms
    v = total - ipi - st                     # valor do produto fecha a nota
    liq = v - icms - pis - cofins
    return dict(total=total, produto=v, icms=icms, pis=pis, cofins=cofins, ipi=ipi, st=st, liquido=liq,
                base_pis=r(v - icms), icms_efetiva=icms / liq)


def em2027(liq):
    """Projeta a partir do valor liquido: base = liquido + CBS + IBS; ICMS por dentro (gross-up); ST; IPI zero."""
    cbs = r(CBS * liq)
    ibs = r(IBS * liq)
    base = liq + cbs + ibs
    produto = r(base / (1 - ICMS))           # gross-up do ICMS sobre a nova base
    icms = produto - base
    st = r(ICMS * produto * (1 + MVA)) - icms
    total = produto + st
    return dict(liquido=liq, cbs=cbs, ibs=ibs, base=base, icms=icms, produto=produto, st=st, ipi=D("0.00"),
                total=total, icms_efetiva=icms / base)


def custo_efetivo_hoje(h):     # revendedor no lucro real: credita ICMS, PIS e COFINS (nao ICMS-ST, nao IPI)
    return h["total"] - h["icms"] - h["pis"] - h["cofins"]


def custo_efetivo_2027(p):     # credita CBS, IBS e ICMS (nao ICMS-ST)
    return p["total"] - p["cbs"] - p["ibs"] - p["icms"]


if __name__ == "__main__":
    h = hoje()
    p = em2027(h["liquido"])
    fmt = lambda x: f"R$ {x:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    print("=== HOJE: nota de", fmt(h["total"]))
    for k in ["produto", "icms", "base_pis", "pis", "cofins", "ipi", "st", "liquido"]:
        print(f"  {k:10s} {fmt(h[k])}")
    print(f"  ICMS efetivo sobre o liquido: {h['icms_efetiva']*100:.2f}%")
    print("=== 2027 (mesmo valor liquido)")
    for k in ["liquido", "cbs", "ibs", "base", "icms", "produto", "st", "ipi", "total"]:
        print(f"  {k:10s} {fmt(p[k])}")
    print(f"  ICMS efetivo sobre a nova base: {p['icms_efetiva']*100:.2f}%")
    ce_h, ce_p = custo_efetivo_hoje(h), custo_efetivo_2027(p)
    print("=== Custo efetivo do cliente (revendedor, lucro real)")
    print("  hoje", fmt(ce_h), "| 2027 (1a forma)", fmt(ce_p), "| queda", fmt(ce_h - ce_p))
    # 2a forma: preco 2027 em que o custo efetivo do cliente fica igual ao de hoje (tudo linear no liquido)
    lo, hi = h["liquido"], h["liquido"] * 2
    for _ in range(60):
        mid = (lo + hi) / 2
        if custo_efetivo_2027(em2027(r(mid))) < ce_h: lo = mid
        else: hi = mid
    p2 = em2027(r(hi))
    print("  2a forma: nota 2027", fmt(p2["total"]), "-> custo efetivo", fmt(custo_efetivo_2027(p2)),
          "| seu liquido", fmt(p2["liquido"]))
    print("=== Compras (credito amplo isolado: CBS + IBS)")
    sem, com = p["total"], p["total"] - p["cbs"] - p["ibs"]
    print("  ignora", fmt(sem), "| considera", fmt(com), "| dif", fmt(sem - com))
    m = D("0.30")
    print("  preco c/ margem 30%:", fmt(sem + r(sem * m)), "x", fmt(com + r(com * m)),
          "| dif", fmt(sem + r(sem * m) - com - r(com * m)), "| margens", fmt(r(sem * m)), fmt(r(com * m)))
