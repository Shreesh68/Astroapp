<?php

declare(strict_types=1);

use Prokerala\Common\Api\Exception\Exception;

function checkDateTime($datetime, $minimum, $maximum): void
{
    try {
        if ($datetime < $minimum || $datetime > $maximum) {
            throw new Exception('Please enter a valid date between "' . $minimum->format('Y-m-d') . '" and "' . $maximum->format('Y-m-d') . '"');
        }
    } catch (\Exception $e) {
        throw new Exception($e->getMessage());
    }
}
function validateDate(
    $date,
    $minimum = new DateTimeImmutable('-1 day'),
    $maximum = new DateTimeImmutable('+1 day')
): void {
    $datetime = new DateTimeImmutable($date);
    $minimum = $minimum->setTime(0, 0, 0);
    $maximum = $maximum->setTime(23, 59, 59);

    checkDateTime($datetime, $minimum, $maximum);
}

function validateDateTime(
    $datetime,
    $tz,
    $minimum = new DateTimeImmutable('-1 day'),
    $maximum = new DateTimeImmutable('+1 day')
): void {
    $datetime = new DateTimeImmutable($datetime, $tz);

    $minimum = $minimum->setTime(0, 0, 0);
    $maximum = $maximum->setTime(23, 59, 59);

    checkDateTime($datetime, $minimum, $maximum);
}
