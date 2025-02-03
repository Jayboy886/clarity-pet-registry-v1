# Pet Breeding Registry

A blockchain-based pet breeding registry system that allows:

- Registration of pets with breed, DNA information, and unique traits
- Breeding of registered pets to create offspring with inherited traits
- Transfer of pet ownership
- Tracking of pet lineage through parent records
- Marketplace functionality for buying and selling pets

The system ensures:
- Only authorized users can register new pets
- Only pet owners can breed their pets
- Same pet cannot be bred with itself
- Transparent and immutable record of pet breeding history
- Secure transfer of pet ownership
- Pet traits are inherited through breeding using a random selection algorithm
- Built-in marketplace for trading pets using STX tokens with price validation
- Event logging for all major operations

## Features

### Pet Traits
- Each pet has 5 unique traits that define its characteristics
- Traits are inherited during breeding with random selection from parents
- Traits add uniqueness and collectible value to pets

### Marketplace
- Pet owners can list their pets for sale by setting a valid price (must be > 0)
- Buyers can purchase listed pets using STX tokens
- Automatic transfer of ownership and payment handling
- Listed pets can be unlisted by the owner

### Event Logging
The contract now logs events for:
- Pet registration
- Breeding operations
- Price changes
- Sales
- Ownership transfers

Built using Clarity language on the Stacks blockchain.
