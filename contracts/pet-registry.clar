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
        birth-block: uint,
        traits: (list 5 (string-ascii 20)),
        price: (optional uint)
    }
)

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-not-authorized (err u100))
(define-constant err-pet-exists (err u101))
(define-constant err-invalid-pet (err u102))
(define-constant err-not-for-sale (err u103))
(define-constant err-insufficient-funds (err u104))
(define-constant err-invalid-price (err u105))
(define-constant err-same-pet (err u106))

;; Events
(define-data-var last-pet-id uint u0)

;; Private functions
(define-private (is-contract-owner)
    (is-eq tx-sender contract-owner)
)

(define-private (calculate-traits (parent1-traits (list 5 (string-ascii 20))) (parent2-traits (list 5 (string-ascii 20))))
    (map unwrap-panic
        (map some 
            (map (lambda (t1 t2) 
                (if (is-eq (rand u100) u1) 
                    t2
                    t1
                ))
            parent1-traits
            parent2-traits
        )
    )
)

;; Public functions
(define-public (register-pet (breed (string-ascii 30)) (dna uint) (traits (list 5 (string-ascii 20))))
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
                    birth-block: block-height,
                    traits: traits,
                    price: none
                })
                (var-set last-pet-id new-id)
                (print {event: "pet-registered", id: new-id, breed: breed})
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
        (new-traits (calculate-traits (get traits pet1) (get traits pet2)))
    )
        (asserts! (not (is-eq pet1-id pet2-id)) err-same-pet)
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
                    birth-block: block-height,
                    traits: new-traits,
                    price: none
                })
                (var-set last-pet-id new-id)
                (print {event: "pets-bred", child: new-id, parent1: pet1-id, parent2: pet2-id})
                (ok new-id)
            )
            err-not-authorized
        )
    )
)

(define-public (set-pet-price (id uint) (new-price (optional uint)))
    (let ((pet (unwrap! (map-get? pet-info id) err-invalid-pet)))
        (asserts! (and 
            (is-some new-price)
            (> (unwrap! new-price err-invalid-price) u0)
        ) err-invalid-price)
        (if (is-eq (get owner pet) tx-sender)
            (begin
                (map-set pet-info id (merge pet { price: new-price }))
                (print {event: "price-set", id: id, price: new-price})
                (ok true)
            )
            err-not-authorized
        )
    )
)

(define-public (buy-pet (id uint))
    (let (
        (pet (unwrap! (map-get? pet-info id) err-invalid-pet))
        (sale-price (unwrap! (get price pet) err-not-for-sale))
    )
        (if (>= (stx-get-balance tx-sender) sale-price)
            (begin
                (try! (stx-transfer? sale-price tx-sender (get owner pet)))
                (try! (nft-transfer? pet id (get owner pet) tx-sender))
                (map-set pet-info id (merge pet { owner: tx-sender, price: none }))
                (print {event: "pet-sold", id: id, price: sale-price, from: (get owner pet), to: tx-sender})
                (ok true)
            )
            err-insufficient-funds
        )
    )
)

(define-public (transfer-pet (id uint) (recipient principal))
    (let ((pet (unwrap! (map-get? pet-info id) err-invalid-pet)))
        (if (is-eq (get owner pet) tx-sender)
            (begin
                (try! (nft-transfer? pet id tx-sender recipient))
                (map-set pet-info id (merge pet { owner: recipient }))
                (print {event: "pet-transferred", id: id, from: tx-sender, to: recipient})
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
