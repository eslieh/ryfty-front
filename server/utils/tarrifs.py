from typing import Optional

def get_b2c_business_charge(amount: float) -> Optional[int]:
    tariff_table = [
        (1, 49, 0),
        (50, 100, 0),
        (101, 500, 5),
        (501, 1000, 5),
        (1001, 1500, 5),
        (1501, 2500, 9),
        (2501, 3500, 9),
        (3501, 5000, 9),
        (5001, 7500, 11),
        (7501, 10000, 11),
        (10001, 15000, 11),
        (15001, 20000, 11),
        (20001, 25000, 13),
        (25001, 30000, 13),
        (30001, 35000, 13),
        (35001, 40000, 13),
        (40001, 45000, 13),
        (45001, 50000, 13),
        (50001, 70000, 13),
        (70001, 250000, 13),
    ]

    for min_amt, max_amt, business_charge in tariff_table:
        if min_amt <= amount <= max_amt:
            return business_charge

    return None  # Out of range

def get_b2b_business_charge(amount: float) -> Optional[int]:
    tariff_table = [
        (1, 49, 2),
        (50, 100, 3),
        (101, 500, 8),
        (501, 1000, 13),
        (1001, 1500, 18),
        (1501, 2500, 25),
        (2501, 3500, 30),
        (3501, 5000, 39),
        (5001, 7500, 48),
        (7501, 10000, 54),
        (10001, 15000, 63),
        (15001, 20000, 68),
        (20001, 25000, 74),
        (25001, 30000, 79),
        (30001, 35000, 90),
        (35001, 40000, 106),
        (40001, 45000, 110),
        (45001, 50000, 115),
        (50001, 70000, 115),
        (70001, 150000, 115),
        (150001, 250000, 115),
        (250001, 500000, 115),
        (500001, 1000000, 115),
        (1000001, 3000000, 115),
        (3000001, 5000000, 115),
        (5000001, 20000000, 115),
        (20000001, 50000000, 115),
    ]

    for min_amt, max_amt, business_charge in tariff_table:
        if min_amt <= amount <= max_amt:
            return business_charge

    return None  # Out of range


def get_original_b2c_value(net_amount: float) -> Optional[float]:
    tariff_table = [
        (1, 49, 0),
        (50, 100, 0),
        (101, 500, 5),
        (501, 1000, 5),
        (1001, 1500, 5),
        (1501, 2500, 9),
        (2501, 3500, 9),
        (3501, 5000, 9),
        (5001, 7500, 11),
        (7501, 10000, 11),
        (10001, 15000, 11),
        (15001, 20000, 11),
        (20001, 25000, 13),
        (25001, 30000, 13),
        (30001, 35000, 13),
        (35001, 40000, 13),
        (40001, 45000, 13),
        (45001, 50000, 13),
        (50001, 70000, 13),
        (70001, 250000, 13),
    ]

    for min_amt, max_amt, charge in tariff_table:
        candidate_gross = net_amount + charge
        if min_amt <= candidate_gross <= max_amt:
            return candidate_gross  # Found the original amount

    return None  # Not found

def get_original_b2b_amount(net_amount: float) -> Optional[float]:
    tariff_table = [
        (1, 49, 2),
        (50, 100, 3),
        (101, 500, 8),
        (501, 1000, 13),
        (1001, 1500, 18),
        (1501, 2500, 25),
        (2501, 3500, 30),
        (3501, 5000, 39),
        (5001, 7500, 48),
        (7501, 10000, 54),
        (10001, 15000, 63),
        (15001, 20000, 68),
        (20001, 25000, 74),
        (25001, 30000, 79),
        (30001, 35000, 90),
        (35001, 40000, 106),
        (40001, 45000, 110),
        (45001, 50000, 115),
        (50001, 70000, 115),
        (70001, 150000, 115),
        (150001, 250000, 115),
        (250001, 500000, 115),
        (500001, 1000000, 115),
        (1000001, 3000000, 115),
        (3000001, 5000000, 115),
        (5000001, 20000000, 115),
        (20000001, 50000000, 115),
    ]

    for min_amt, max_amt, charge in tariff_table:
        candidate = net_amount + charge
        if min_amt <= candidate <= max_amt:
            return candidate

    return None  # No matching band