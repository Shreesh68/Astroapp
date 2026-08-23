<?php

declare(strict_types=1);

use Prokerala\Api\Horoscope\Result\DailyHoroscopeAdvancedResponse;
use Prokerala\Api\Horoscope\Service\DailyPredictionAdvanced;
use Prokerala\Common\Api\Exception\AuthenticationException;
use Prokerala\Common\Api\Exception\Exception;
use Prokerala\Common\Api\Exception\QuotaExceededException;
use Prokerala\Common\Api\Exception\RateLimitExceededException;
use Prokerala\Common\Api\Exception\ValidationException;
use Symfony\Component\Cache\Adapter\FilesystemAdapter;
use Symfony\Contracts\Cache\ItemInterface;

require __DIR__ . '/bootstrap.php';

$calculators = [];

$submit = $_POST['submit'] ?? 0;

$sample_name = 'daily-horoscope';

$arSign = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
$signSymbols = ['aries' => '♈', 'taurus' => '♊', 'gemini' => '♌', 'cancer' => '♎', 'leo' => '♐', 'virgo' => '♒', 'libra' => '♉', 'scorpio' => '♋', 'sagittarius' => '♍', 'capricorn' => '♏', 'aquarius' => '♑', 'pisces' => '♓'];
foreach ($arSign as $value) {
    $arSignData[$value] = $signSymbols[$value] . '  ' . ucfirst($value);
}

$timezone = 'Asia/Kolkata';
$tz = new DateTimeZone($timezone);
$datetime = new DateTimeImmutable('now', $tz);

$selectedSign = $_POST['sign'] ?? null;
$selectedType = $_POST['type'] ?? null;
$errors = [];
$result = null;
if ($submit) {
    try {
        $horoscopeClass = new DailyPredictionAdvanced($client);
        $cache = new FilesystemAdapter();
        $result = $cache->get("daily_horoscope_{$selectedSign}_{$selectedType}", function (ItemInterface $item) use ($horoscopeClass, $datetime, $selectedSign, $selectedType): DailyHoroscopeAdvancedResponse {
            $item->expiresAfter(28800);

            return $horoscopeClass->process($datetime, $selectedSign, $selectedType);
        });
        $dailyPredictions = $result->getDailyPredictions();
        foreach ($dailyPredictions as $dailyPrediction) {
            if (strtolower($dailyPrediction->getSign()->getName()) === $selectedSign) {
                $resultPrediction = $dailyPrediction;
            }
        }

        foreach ($resultPrediction->getPredictions() as $prediction) {
            if (strtolower($prediction->getType()) === strtolower($selectedType)) {
                $predictionList = $prediction;
            }
        }
    } catch (ValidationException $e) {
        $errors = $e->getValidationErrors();
    } catch (QuotaExceededException $e) {
        $errors['message'] = 'ERROR: You have exceeded your quota allocation for the day';
    } catch (RateLimitExceededException $e) {
        $errors['message'] = 'ERROR: Rate limit exceeded. Throttle your requests.';
    } catch (AuthenticationException $e) {
        $errors = ['message' => $e->getMessage()];
    } catch (Exception $e) {
        $errors = ['message' => "API Request Failed with error {$e->getMessage()}"];
    } catch (\Psr\Cache\InvalidArgumentException $e) {
        $errors = ['message' => "API Request Failed with error {$e->getMessage()}"];
    }
}

$apiCreditUsed = $client->getCreditUsed();

include DEMO_BASE_DIR . '/templates/daily-horoscope.tpl.php';
