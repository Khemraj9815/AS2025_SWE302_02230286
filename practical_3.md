# Practical 3: Specification-Based Testing for `CalculateShippingFee`

## Part 1: Test Case Design (Analysis)

### 1. Equivalence Partitioning

| Partition | Input         | Description                                   | Example(s)      |
|-----------|--------------|-----------------------------------------------|-----------------|
| P1        | weight       | Invalid: too small (≤ 0)                      | -5, 0           |
| P2        | weight       | Valid: Standard package (0 < w ≤ 10)          | 1, 5, 10        |
| P3        | weight       | Valid: Heavy package (10 < w ≤ 50)            | 11, 20, 50      |
| P4        | weight       | Invalid: too large (> 50)                     | 51, 100         |
| P5        | zone         | Valid zone                                    | Domestic, International, Express |
| P6        | zone         | Invalid zone                                  | Local, "", domestic (wrong case) |
| P7        | insured      | Not insured                                   | false           |
| P8        | insured      | Insured                                       | true            |

### 2. Boundary Value Analysis

| Boundary      | Value     | Expected Result                 | Description                |
|---------------|-----------|----------------------------------|----------------------------|
| Lower         | 0         | Error (invalid)                  | Just outside valid         |
| Lower         | 0.01      | OK (Standard)                    | Smallest valid             |
| Standard/Heavy| 10        | OK (Standard)                    | Edge of standard           |
| Standard/Heavy| 10.01     | OK (Heavy, surcharge applies)    | First heavy package        |
| Upper         | 50        | OK (Heavy, surcharge applies)    | Largest valid              |
| Upper         | 50.01     | Error (invalid)                  | Just outside valid         |

### 3. Decision Table

| Rule # | weight         | zone            | insured | Expected Outcome                                              |
|--------|---------------|-----------------|---------|--------------------------------------------------------------|
| 1      | ≤ 0 or > 50   | any             | any     | Error: invalid weight                                        |
| 2      | valid         | invalid         | any     | Error: invalid zone                                          |
| 3      | (0, 10]       | valid           | false   | Standard fee (base only)                                     |
| 4      | (0, 10]       | valid           | true    | Standard fee + insurance                                     |
| 5      | (10, 50]      | valid           | false   | Heavy fee (base + surcharge)                                 |
| 6      | (10, 50]      | valid           | true    | Heavy fee + insurance (1.5% of [base + surcharge])           |

---

## Why These Partitions and Boundaries?

- **Weight:** The business logic is driven by weight tiers, thus we must test values inside, at the edge, and just outside those tiers.
- **Zone:** Only exact matches are allowed—case sensitivity and typos must be tested.
- **Insured:** It's a boolean, so both values must be tested in combination with other partitions.

---

## Part 2: Go Test Implementation

See `shipping_v2_test.go` for the comprehensive table-driven test function, which covers all the above partitions and boundary values.

---


## Result
![picture](/assets/p3-1.png)
![picture](/assets/p3-2.png)

- [[Github link](https://github.com/Khemraj9815/SWE302/tree/main/practical_3)] All code files, including `shipping_v2.go` and `shipping_v2_test.go`
