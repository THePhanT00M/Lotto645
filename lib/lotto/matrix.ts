/**
 * 특징 분포를 다루는 데 필요한 최소한의 행렬 연산
 *
 * 외부 수치 라이브러리를 들이지 않고, 공분산과 그 역행렬 그리고
 * 마할라노비스 거리까지만 직접 구현한다.
 */

/** 열 단위 평균 벡터 */
export const meanVector = (rows: readonly number[][]): number[] => {
  const dimension = rows[0]?.length ?? 0
  const mean = new Array(dimension).fill(0)

  for (const row of rows) {
    for (let i = 0; i < dimension; i++) mean[i] += row[i]
  }

  return mean.map((value) => value / rows.length)
}

/** 열 단위 표준편차. 분산이 0인 열은 나눗셈이 깨지지 않도록 1로 둔다. */
export const standardDeviation = (rows: readonly number[][], mean: readonly number[]): number[] => {
  const dimension = mean.length
  const variance = new Array(dimension).fill(0)

  for (const row of rows) {
    for (let i = 0; i < dimension; i++) {
      const diff = row[i] - mean[i]
      variance[i] += diff * diff
    }
  }

  return variance.map((value) => {
    const sd = Math.sqrt(value / rows.length)
    return sd < 1e-9 ? 1 : sd
  })
}

/** 평균 0, 표준편차 1로 맞춘다. */
export const standardize = (row: readonly number[], mean: readonly number[], sd: readonly number[]): number[] =>
    row.map((value, i) => (value - mean[i]) / sd[i])

/**
 * 공분산 행렬.
 *
 * 표본 수가 차원 수에 비해 넉넉하지 않으면 역행렬이 불안정해지므로
 * 대각선에 작은 값을 더해(리지 정칙화) 안정시킨다.
 */
export const covarianceMatrix = (
    rows: readonly number[][],
    mean: readonly number[],
    ridge = 1e-3,
): number[][] => {
  const dimension = mean.length
  const matrix = Array.from({ length: dimension }, () => new Array(dimension).fill(0))

  for (const row of rows) {
    for (let i = 0; i < dimension; i++) {
      const di = row[i] - mean[i]
      for (let j = i; j < dimension; j++) {
        matrix[i][j] += di * (row[j] - mean[j])
      }
    }
  }

  for (let i = 0; i < dimension; i++) {
    for (let j = i; j < dimension; j++) {
      const value = matrix[i][j] / rows.length
      matrix[i][j] = value
      matrix[j][i] = value
    }
    matrix[i][i] += ridge
  }

  return matrix
}

/**
 * 가우스-조던 소거법으로 역행렬을 구한다.
 *
 * 각 단계에서 절댓값이 가장 큰 행을 골라(부분 피벗) 수치 오차를 줄인다.
 * 특이 행렬이면 null을 돌려주고, 호출한 쪽에서 대체 경로를 택하게 한다.
 */
export const invert = (source: readonly number[][]): number[][] | null => {
  const n = source.length
  const a = source.map((row) => [...row])
  const inverse: number[][] = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  )

  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row
    }

    if (Math.abs(a[pivot][col]) < 1e-12) return null

    ;[a[col], a[pivot]] = [a[pivot], a[col]]
    ;[inverse[col], inverse[pivot]] = [inverse[pivot], inverse[col]]

    const scale = a[col][col]
    for (let j = 0; j < n; j++) {
      a[col][j] /= scale
      inverse[col][j] /= scale
    }

    for (let row = 0; row < n; row++) {
      if (row === col) continue
      const factor = a[row][col]
      if (factor === 0) continue
      for (let j = 0; j < n; j++) {
        a[row][j] -= factor * a[col][j]
        inverse[row][j] -= factor * inverse[col][j]
      }
    }
  }

  return inverse
}

/**
 * 마할라노비스 거리의 제곱.
 *
 * 각 특징을 따로 재는 대신 특징들이 함께 움직이는 정도까지 반영해,
 * 과거 당첨 조합들이 이루는 분포의 중심에서 얼마나 떨어졌는지 잰다.
 */
export const mahalanobisSquared = (
    row: readonly number[],
    mean: readonly number[],
    inverseCovariance: readonly number[][],
): number => {
  const diff = row.map((value, i) => value - mean[i])
  let total = 0

  for (let i = 0; i < diff.length; i++) {
    let partial = 0
    for (let j = 0; j < diff.length; j++) {
      partial += inverseCovariance[i][j] * diff[j]
    }
    total += diff[i] * partial
  }

  return Math.max(0, total)
}
