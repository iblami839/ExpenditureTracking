;; Political Donation and Expenditure Tracking Contract
;; Implements transparent donation management and spending controls

;; Data Variables
(define-data-var minimum-donation uint u100000) ;; in microSTX (0.1 STX)
(define-map donors principal (tuple (total-donated uint) (last-donation uint)))
(define-map spending-categories (string-ascii 64) (tuple (allocated uint) (spent uint) (active bool)))
(define-map expenditures uint (tuple
    (amount uint)
    (category (string-ascii 64))
    (recipient principal)
    (description (string-ascii 256))
    (approved bool)
))
(define-data-var expenditure-nonce uint u0)

;; Error Constants
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-BELOW-MINIMUM (err u101))
(define-constant ERR-INVALID-CATEGORY (err u102))
(define-constant ERR-INSUFFICIENT-FUNDS (err u103))

;; Contract Owner
(define-constant contract-owner tx-sender)

;; Read-Only Functions

(define-read-only (get-donor-info (donor principal))
    (default-to
        (tuple (total-donated u0) (last-donation u0))
        (map-get? donors donor)
    )
)

(define-read-only (get-category-info (category (string-ascii 64)))
    (default-to
        (tuple (allocated u0) (spent u0) (active false))
        (map-get? spending-categories category)
    )
)

(define-read-only (get-expenditure (id uint))
    (map-get? expenditures id)
)

;; Public Functions

(define-public (donate)
    (let (
        (amount (stx-get-balance tx-sender))
        (donor-data (get-donor-info tx-sender))
    )
    (if (< amount (var-get minimum-donation))
        ERR-BELOW-MINIMUM
        (begin
            (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
            (map-set donors tx-sender
                (tuple
                    (total-donated (+ (get total-donated donor-data) amount))
                    (last-donation block-height)
                )
            )
            (ok amount)
        )
    ))
)
