Pod::Spec.new do |spec|
  spec.name = 'boost'
  spec.version = '1.76.0'
  spec.license = { :type => 'Boost Software License', :file => "LICENSE_1_0.txt" }
  spec.homepage = 'http://www.boost.org'
  spec.summary = 'Boost provides free peer-reviewed portable C++ source libraries.'
  spec.authors = 'Rene Rivera'

  # Workaround: some networks block boostorg.jfrog.io, which causes CocoaPods to download an HTML error page
  # instead of the tarball. archives.boost.io hosts the same release artifact.
  spec.source = {
    :http => 'https://archives.boost.io/release/1.76.0/source/boost_1_76_0.tar.bz2',
    :sha256 => 'f0397ba6e982c4450f27bf32a2a83292aba035b827a5623a14636ea583318c41'
  }

  # Pinning to the same version as React.podspec.
  spec.platforms = { :ios => '11.0', :tvos => '11.0' }
  spec.requires_arc = false

  spec.module_name = 'boost'
  spec.header_dir = 'boost'
  spec.preserve_path = 'boost'
end
