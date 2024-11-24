;; Pet Registry Contract
(define-non-fungible-token pet uint)

;; Data structures
(define-map pet-info
    uint 
    {
        owner: principal,
        breed: (string-ascii 30),
        dna: uint,
        parent1: (optional uint),
        parent2: (optional uint),
        birth-block: uint
    }
)

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-not-authorized (err u100))
(define-constant err-pet-exists (err u101))
(define-constant err-invalid-pet (err u102))

;; Data vars
(define-data-var last-pet-id uint u0)

;; Private functions
(define-private (is-contract-owner)
    (is-eq tx-sender contract-owner)
)

;; Public functions
(define-public (register-pet (breed (string-ascii 30)) (dna uint))
    (let ((new-id (+ (var-get last-pet-id) u1)))
        (if (is-contract-owner)
            (begin
                (try! (nft-mint? pet new-id tx-sender))
                (map-set pet-info new-id {
                    owner: tx-sender,
                    breed: breed,
                    dna: dna,
                    parent1: none,
                    parent2: none,
                    birth-block: block-height
                })
                (var-set last-pet-id new-id)
                (ok new-id)
            )
            err-not-authorized
        )
    )
)

(define-public (breed-pets (pet1-id uint) (pet2-id uint))
    (let (
        (pet1 (unwrap! (map-get? pet-info pet1-id) err-invalid-pet))
        (pet2 (unwrap! (map-get? pet-info pet2-id) err-invalid-pet))
        (new-id (+ (var-get last-pet-id) u1))
        (new-dna (/ (+ (get dna pet1) (get dna pet2)) u2))
    )
        (if (and
            (is-eq (get owner pet1) tx-sender)
            (is-eq (get owner pet2) tx-sender)
        )
            (begin
                (try! (nft-mint? pet new-id tx-sender))
                (map-set pet-info new-id {
                    owner: tx-sender,
                    breed: (get breed pet1),
                    dna: new-dna,
                    parent1: (some pet1-id),
                    parent2: (some pet2-id),
                    birth-block: block-height
                })
                (var-set last-pet-id new-id)
                (ok new-id)
            )
            err-not-authorized
        )
    )
)

(define-public (transfer-pet (id uint) (recipient principal))
    (let ((pet (unwrap! (map-get? pet-info id) err-invalid-pet)))
        (if (is-eq (get owner pet) tx-sender)
            (begin
                (try! (nft-transfer? pet id tx-sender recipient))
                (map-set pet-info id (merge pet { owner: recipient }))
                (ok true)
            )
            err-not-authorized
        )
    )
)

;; Read only functions
(define-read-only (get-pet-info (id uint))
    (map-get? pet-info id)
)

(define-read-only (get-last-pet-id)
    (ok (var-get last-pet-id))
)
