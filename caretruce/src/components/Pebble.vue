<template>
  <view class="sculpture" aria-hidden="true"
    ><view class="pebble one" /><view class="pebble two" /><view class="shadow"
  /></view>
</template>
<style scoped>
.sculpture {
  height: 260px;
  width: 280px;
  position: relative;
  margin: 0 auto;
}
.pebble {
  position: absolute;
  background: linear-gradient(
    145deg,
    rgba(238, 248, 255, 0.9),
    rgba(117, 175, 218, 0.45) 45%,
    rgba(214, 236, 252, 0.65) 70%,
    rgba(108, 163, 208, 0.6)
  );
  border: 1px solid rgba(163, 203, 234, 0.65);
  box-shadow:
    inset 8px 12px 20px rgba(255, 255, 255, 0.8),
    inset -7px -10px 18px rgba(96, 153, 198, 0.2),
    0 12px 25px rgba(103, 147, 179, 0.08);
}
.one {
  width: 220px;
  height: 142px;
  border-radius: 52% 48% 50% 50%;
  transform: rotate(-35deg);
  left: 15px;
  top: 38px;
}
.two {
  width: 160px;
  height: 102px;
  border-radius: 50%;
  transform: rotate(-25deg);
  left: 110px;
  top: 125px;
}
.shadow {
  position: absolute;
  bottom: 12px;
  left: 40px;
  width: 205px;
  height: 17px;
  border-radius: 50%;
  background: #c8dbe8;
  filter: blur(15px);
  z-index: -1;
}
</style>
