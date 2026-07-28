$htmlPath = "slides-circle-1\index.html"
$lines = Get-Content $htmlPath -Encoding UTF8

$output = @()
$slideCounter = 1

foreach ($line in $lines) {
    if ($line -match 'id="slide-\d+"') {
        $line = $line -replace 'id="slide-\d+"', "id=`"slide-$slideCounter`""
        $slideCounter++
    }
    # Fix the page-index string (like 05 / 22) to use 23
    if ($line -match '<span class="page-index">(\d{2}) / 2[12]</span>') {
        $numStr = $matches[1]
        $num = [int]$numStr
        # since we will insert one slide after 5, any number >= 6 will actually just be sequentially correct.
        # But wait! I haven't inserted the slide yet.
    }
    
    $output += $line
}

Set-Content -Path $htmlPath -Value $output -Encoding UTF8
