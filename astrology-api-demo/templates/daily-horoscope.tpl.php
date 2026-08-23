<!DOCTYPE HTML>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <?php if ($result):?>
        <title> Today's <?=ucfirst($selectedSign)?> <?= $predictionList->getType() ?> Daily Horoscope | Astrology API Demo - Prokerala Astrology</title>
    <?php else: ?>
        <title>Daily Horoscope | Astrology API Demo - Prokerala Astrology</title>
    <?php endif; ?>
    <?php include 'common/style.tpl.php'; ?>
    <link rel="stylesheet" href="<?=DEMO_BASE_URL?>/build/style.css">
    <link rel="stylesheet" href="<?=DEMO_BASE_URL?>/build/reports.css">
    <style>
        .table{
            max-width: 800px;
            margin: auto;
        }
    </style>
</head>

<body>
<?php include 'common/header.tpl.php'; ?>

<div class="main-content">
    <div class="header-1 section-rotate bg-section-secondary">
        <div class="section-inner bg-gradient-violet bg-container section-radius-min">
        </div>
        <div class="container top-header-wrapper">
            <div class="row my-auto">
                <div class="col-xl-6 col-lg-7 col-md-12 col-sm-12 text-lg-left top-header-text-content">
                    <h2 class="text-white mb-5">
                        <?php if ($result):?>
                            <span class="font-weight-thin"> Today's <?=ucfirst($selectedSign)?> <?=$predictionList->getType()?> Daily Horoscope</span>
                        <?php else: ?>
                            <span class="font-weight-thin">Daily Horoscope</span>
                        <?php endif; ?>
                    </h2>
                </div>
            </div>
        </div>
    </div>
    <div class="container prokerala-api-demo-container">

        <?php include 'common/helper.tpl.php'; ?>

        <section>
            <?php if ($result):?>
            <div>
                <p><?=$predictionList->getPrediction()?></p>
            </div>
            <?php endif?>
            <br>
            <br>
            <div class="card contact-form-wrapper box-shadow mx-auto rounded-2 mb-5">
                <form class="p-5 text-default" action="daily-horoscope.php" method="POST">
                    <div class="form-group row">
                        <label class="col-sm-3 col-md-4 col-form-label  text-md-right text-xs-left">Sign</label>
                        <div class="col-sm-9 col-md-6">
                            <select name="sign" class="form-control form-control-lg rounded-1">
                                <?php foreach ($arSignData as $key => $data):?>
                                    <option value="<?= $key ?>" <?= $key === $selectedSign ? 'selected' : '' ?>>
                                        <?= $data ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>

                    <div class="form-group row">
                        <label class="col-sm-3 col-md-4 col-form-label  text-md-right text-xs-left">Type</label>
                        <div class="col-sm-9 col-md-6">
                            <select name="type" class="form-control form-control-lg rounded-1">
                                <option value="general" <?= 'general' === $selectedType ? 'selected' : ''?>>General</option>
                                <option value="health" <?= 'health' === $selectedType ? 'selected' : ''?>>Health</option>
                                <option value="career" <?= 'career' === $selectedType ? 'selected' : ''?>>Career</option>
                                <option value="love" <?= 'love' === $selectedType ? 'selected' : ''?>>Love</option>
                            </select>
                        </div>
                    </div>
                    <div id="form-hidden-fields">

                    </div>
                    <div class="text-right">
                        <button type="submit" class="btn btn-warning btn-submit ">Get Daily Horoscope</button>
                        <input type="hidden" name="submit" value="1">
                    </div>
                </form>
            </div>
        </section>
        <?php include 'common/calculator-list.tpl.php'; ?>

    </div>
</div>
<?php include 'common/footer.tpl.php'; ?>
</body>
</html>
