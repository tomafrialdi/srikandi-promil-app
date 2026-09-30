const id = new Intl.NumberFormat('id-ID')

/** 350000 -> "350.000" */
export const rp = (n: number) => id.format(n)
