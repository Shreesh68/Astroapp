<!DOCTYPE HTML>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <?php if ($result):?>
        <title>Today's <?=$dailyLovePredictions[0]->getSignCombination()?>Love Horoscope</title>
    <?php else: ?>
        <title>Daily Love Horoscope | Astrology API Demo - Prokerala Astrology</title>
    <?php endif; ?>
    <?php include 'common/style.tpl.php'; ?>
    <link rel="stylesheet" href="<?=DEMO_BASE_URL?>/build/style.css">
    <link rel="stylesheet" href="<?=DEMO_BASE_URL?>/build/reports.css">
    <style>
        .table{
            max-width: 800px;
            margin: auto;
        }

         .daily-love-horoscope{
             max-width:800px;
             margin: auto;
             border: 1px solid #ddd;
             padding: 2rem;
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
                            <span class="font-weight-thin">Today's <?= $dailyLovePredictions[0]->getSignCombination() ?> Love Horoscope</span>
                        <?php else: ?>
                            <span class="font-weight-thin">Daily Love Horoscope</span>
                        <?php endif; ?>
                    </h2>
                </div>
            </div>
        </div>
    </div>
    <br>
    <div class="container prokerala-api-demo-container">
        <?php include 'common/helper.tpl.php'; ?>
        <?php if (!empty($result)): ?>
                <?php foreach ($dailyLovePredictions as $key => $dailyLovePrediction): ?>
                    <div>
                        <p><?= $dailyLovePrediction->getPrediction()?></p>
                    </div>
                <?php endforeach?>
        <?php endif; ?>
        <section>
            <div class="card contact-form-wrapper box-shadow mx-auto rounded-2 mb-5">
                <form class="p-5 text-default" action="love-horoscope.php" method="POST">
                    <p class="text-center"> Select your sign and your partner’s sign to discover today's Love Horoscope.</p>
                    <div class="form-group row">
                        <label class="col-sm-3 col-md-4 col-form-label  text-md-right text-xs-left">Your Sign</label>
                        <div class="col-sm-9 col-md-6">
                            <select name="sign_one" class="form-control form-control-lg rounded-1">
                                <?php foreach ($arSignData as $key => $data):?>
                                    <option value="<?= $key ?>" <?= $key === $sign_one ? 'selected' : '' ?>>
                                        <?= $data ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>

                    <div class="form-group row">
                        <label class="col-sm-3 col-md-4 col-form-label  text-md-right text-xs-left">Partner's Sign</label>
                        <div class="col-sm-9 col-md-6">
                            <select name="sign_two" class="form-control form-control-lg rounded-1">
                                <?php foreach ($arSignData as $key => $data):?>
                                    <option value="<?= $key ?>" <?= $key === $sign_two ? 'selected' : '' ?>>
                                        <?= $data ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>
                    <div id="form-hidden-fields">

                    </div>
                    <div class="text-right">
                        <button type="submit" class="btn btn-warning btn-submit ">Get Love Horoscope</button>
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
