# epoch_duration_oracle

The goal of this oracle is to provide an on-ledger duration of all passed epoch since creation of the component as well as a way to compute time elapsed between an epoch and the current epoch.

This does not mean to be a precise clock ticking every seconds, but more of an on-ledger information on whether a time milestone was reached or not. This can not be used as a precise timer for short delays, but can show useful to request time between multiple epochs (the bigger the range, the less significant will be the potential error).

> All durations are currently in milliseconds.

## Use cases

An example of usage could be a timed auction. We would:

- create the auction with a duration
- during creation, mark the current epoch
- when doing various auction actions, we could call the oracle to know whether the time spent between current timestamp and creation timestamp is higher than auction duration, in which case we would end the auction

Instead of providing an "erratic" epoch duration, this would make that auction more precise in terms of human intelligible duration.

## Running

### Feed the oracle

To run and test the epoch oracle, you can run one of the following:

> - update the oracle only once per epoch (epochs are synchronized with PTE):
>
> ```console
> me@os:~$ (cd scrypto/epoch_duration_oracle && ./tick_on_epoch.sh)
>     Current epoch 633, last epoch 633...
>     Current epoch 633, last epoch 633...
>     Current epoch set!
>     Transaction Status: SUCCESS
>     Execution Time: 16 ms
>     Instructions:
>     ├─ CallMethod { component_address: 020d3869346218a5e8deaaf2001216dc00fcacb79fb43e30ded79a, method: "create_proof_by_amount", args: [Decimal("1"), ResourceAddress("03f1820412ec5c07b54ff0407eb00bfc54f58d0784f3eabc2df9c7")] }
>     └─ CallMethod { component_address: 028b858b202333e09f6bf24756b17e51cb6f6882d8bde08a47bdf1, method: "tick", args: [1035068u64] }
>     Instruction Outputs:
>     ├─ Proof(1024u32)
>     └─ 634u64
>     Logs: 0
>     New Entities: 0
>     Current epoch 634, last epoch 634...
>     Current epoch 634, last epoch 634...
> ```

> - update the oracle each second (starts with epoch from PTE then increments epoch each seconds):
>
> ```console
> me@os:~$ (cd scrypto/epoch_duration_oracle && ./tick_asap.sh)
>     Current epoch set!
>     Transaction Status: SUCCESS
>     Execution Time: 14 ms
>     Instructions:
>     ├─ CallMethod { component_address: 020d3869346218a5e8deaaf2001216dc00fcacb79fb43e30ded79a, method: "create_proof_by_amount", args: >     [Decimal("1"), ResourceAddress("0384a3fa191c5506fe5df8a4622cb6eead59deab9d7fc48f64fc98")] }
>     └─ CallMethod { component_address: 0244e8cb7761a9b1980e52d70999b4075f182839cec77bfffc1f6c, method: "tick", args: [781u64] }
>     Instruction Outputs:
>     ├─ Proof(1024u32)
>     └─ 10u64
>     Logs: 0
>     New Entities: 0
>     Current epoch set!
>     Transaction Status: SUCCESS
>     Execution Time: 17 ms
>     Instructions:
>     ├─ CallMethod { component_address: 020d3869346218a5e8deaaf2001216dc00fcacb79fb43e30ded79a, method: "create_proof_by_amount", args: >     [Decimal("1"), ResourceAddress("0384a3fa191c5506fe5df8a4622cb6eead59deab9d7fc48f64fc98")] }
>     └─ CallMethod { component_address: 0244e8cb7761a9b1980e52d70999b4075f182839cec77bfffc1f6c, method: "tick", args: [1063u64] }
>     Instruction Outputs:
>     ├─ Proof(1024u32)
>     └─ 10u64
>     Logs: 0
>     New Entities: 0
> ```

### Query time since epoch

To query from the start of the oracle state, you can use:

```bash
resim run scrypto/epoch_duration_oracle/manifests/since_epoch_0.manifest
```

To see the difference, there is also a `since_epoch_{current_epoch_on_pte01 + 1}.manifest` to compute time elapsed from different epoch and a `since_epoch_0.manifest` to query elapsed time from the start of the oracle.

> *e.g.*:
> ```bash
> resim run scrypto/epoch_duration_oracle/manifests/since_epoch_9.manifest | grep 'Instruction Outputs' -A 1;
> resim run scrypto/epoch_duration_oracle/manifests/since_epoch_10.manifest | grep 'Instruction Outputs' -A 1;
> ```

## ABI

The available functions are:

- `EpochDurationOracle::new`: creates a new oracle starting from now and disregarding already elapsed time (does not consider elapsed time of the passed epochs).
- `EpochDurationOracle::new_with_bootstrap(last_epoch: u64, millis_in_last_epoch: u64)`: creates a new oracle starting from `last_epoch` which lasted `millis_in_last_epoch`. This is useful if you want to start the oracle at a given point in time (but after January 1st 1970).

The available method for oracle creator is:

- `EpochDurationOracle::tick(millis_since_last_tick: u64)`: ticks the internal clock by the provided milliseconds. This can:
  - end the current epoch, categorize it with its duration and start counting down for a new epoch if previous epoch just ended
  - add the tick amount to the epoch being currently counted down
  - this always return the current ledger epoch

The available open methods are:

- `EpochDurationOracle::millis_since_epoch(epoch: u64)`: measure time passed between provided `epoch` and current epoch. This can give birth to few cases:
  - the provided `epoch` is higher than on-ledger epoch: we will return an error
  - the provided `epoch` is equal to the on-ledger epoch: we will return the time spent on the current epoch
  - the provided `epoch` is lower than the on-ledger epoch: we will return the time spent between provided epoch and current epoch
  - the provided `epoch` does not appear for oracle was not created yet: we will return the time spent from the closest lower bound epoch and current epoch (*e.g.*: if you request time spent from epoch `10` and oracle missed it, but we have epoch `11` and `12` and are in epoch `13`, we will compute time spent between epoch `13` and `11` and consider epoch `10` lasted `0`. This is acceptable since we are using timestamp, the actual duration will remain correct)

- `EpochDurationOracle::millis_in_epoch(epoch: u64)`: measure duration of provided `epoch`. This can give birth to few cases:
  - the provided `epoch` is higher than on-ledger epoch: we return an error
  - the provided `epoch` is equal to the on-ledger epoch: we will return the time spent on the current epoch
  - the provided `epoch` is lower than the on-ledger epoch: we will return the time spent between provided epoch and current epoch
  - the provided `epoch` is passed but not present on oracle: we will return 0 and suggest calling the `millis_since_epoch` method

> Note: we will be adding a method to get duration between two epochs provided.

## License

The Radix Scrypto Challenges code is released under Radix Modified MIT License.

    Copyright 2024 Radix Publishing Ltd

    Permission is hereby granted, free of charge, to any person obtaining a copy of
    this software and associated documentation files (the "Software"), to deal in
    the Software for non-production informational and educational purposes without
    restriction, including without limitation the rights to use, copy, modify,
    merge, publish, distribute, sublicense, and to permit persons to whom the
    Software is furnished to do so, subject to the following conditions:

    This notice shall be included in all copies or substantial portions of the
    Software.

    THE SOFTWARE HAS BEEN CREATED AND IS PROVIDED FOR NON-PRODUCTION, INFORMATIONAL
    AND EDUCATIONAL PURPOSES ONLY.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
    FOR A PARTICULAR PURPOSE, ERROR-FREE PERFORMANCE AND NONINFRINGEMENT. IN NO
    EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES,
    COSTS OR OTHER LIABILITY OF ANY NATURE WHATSOEVER, WHETHER IN AN ACTION OF
    CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
    SOFTWARE OR THE USE, MISUSE OR OTHER DEALINGS IN THE SOFTWARE. THE AUTHORS SHALL
    OWE NO DUTY OF CARE OR FIDUCIARY DUTIES TO USERS OF THE SOFTWARE.