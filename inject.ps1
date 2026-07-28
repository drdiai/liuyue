$htmlPath = "slides-circle-1\index.html"
$html = Get-Content $htmlPath -Raw

# Update title
$html = $html -replace "六年级数学上册 · 第二单元《圆》第2课时", "六年级数学上册 · 第一课时：车轮为什么是圆的 & 圆的认识（一）"

# Fix totalSlides counter
$html = $html -replace "const totalSlides = 22;", "const totalSlides = 23;"
$html = $html -replace ">22</span>", ">23</span>"

# First, rename old slide-6 through slide-22 to slide-7 through slide-23
for ($i = 22; $i -ge 6; $i--) {
    $next = $i + 1
    # Update ID
    $html = $html -replace "id=`"slide-$i`"", "id=`"slide-$next`""
}

# Also update the page-index badges: 06 / 21 -> 07 / 23
# The current HTML has "/ 21" or "/ 22"? Let's just fix all of them!
$html = [regex]::Replace($html, "(\d{2})\s+/\s+\d{2}", {
    param($match)
    $numStr = $match.Groups[1].Value
    $num = [int]$numStr
    if ($num -ge 6) {
        $num = $num + 1
    }
    return "$("{0:D2}" -f $num) / 23"
})

# Now inject the NEW slide-6
$newSlide = @"
      <!-- SLIDE 6: 互动演练 (GeoGebra) -->
      <div class="slide" id="slide-6">
        <div class="slide-header">
          <span class="topic-badge">互动演练</span>
          <span class="slide-title">GeoGebra：动态圆规画圆实验室</span>
          <span class="page-index">06 / 23</span>
        </div>
        <div class="slide-body" style="padding: 0; overflow: hidden; position: relative;">
          <iframe src="geogebra-compass.html" style="width: 100%; height: 100%; border: none; border-radius: 12px;"></iframe>
        </div>
      </div>

"@

$html = $html -replace '      <!-- SLIDE 6: 第二关过渡页 -->', "$newSlide      <!-- SLIDE 6: 第二关过渡页 (现在变为7) -->"

Set-Content -Path $htmlPath -Value $html -Encoding UTF8
Write-Output "Done"
